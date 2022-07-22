class Utils {
    static getRandomNum(min = 0, max = 10){
        return Math.random() * (max - min) + min;
    }

    static isRectIntersects(object1, object2){
        let x1 = object1.x,
            y1 = object1.y,
            w1 = object1.width,
            h1 = object1.height,

            x2 = object2.x,
            y2 = object2.y,
            w2 = object2.width,
            h2 = object2.height;


        return y1 + h1 > y2 
            && x1 + w1 > x2 
            && x1 < x2 + w2 
            && y1 < y2 + h2;
    }
}

class UI {
    constructor(){
        this.dev = {
            body: document.querySelector("#dev_hud"),
            y: document.querySelector("#dev_hud").children[0],
            velocity: document.querySelector("#dev_hud").children[1],
            flyState: document.querySelector("#dev_hud").children[2],
            score: document.querySelector("#dev_hud").children[3],
        }
    }

    update(type, prop, value){
        this[type][prop].innerHTML = prop +": "+ value;
    }
}

class World{
    constructor({ background  = "black", speed = 2}){
        this.canvas = document.querySelector("#screen");
        this.context = this.canvas.getContext('2d');
        this.background = background;

        this.children = [];

        this.barrierDistance = 200;
        this.barriersAmount = 1;

        this.speed = speed;

        this.score = 0;

        this.width = this.canvas.width;
        this.height = this.canvas.height;

        this.render = this.render.bind(this);
    }

    getAllBarriers(){
        return this.children.filter(item => {
            return item.constructor.name !== "Bird";
        });
    }

    generateWorldBarriers(){
        let barriers = [];
        for(let i = 0; i < this.barriersAmount; i++){
            let height = Utils.getRandomNum(3, 10),
                x_offset = Utils.getRandomNum(70, 100),
                y_offest = Utils.getRandomNum(9, 27) * 10,
                x = barriers.length > 0 ? barriers[i].x + barriers[i].width + x_offset : x_offset;

            let top_tube = new Tube({
                x: x,
                y: 0,
                height: this.height / height,
            }); 
            
            let bottom_tube = new Tube({
                x: x,
                y: 0 + top_tube.height + y_offest,
                height: this.height - height,
            });

            top_tube.addToWorld(this);
            bottom_tube.addToWorld(this);

            barriers.push(top_tube);
            barriers.push(bottom_tube);

            top_tube.render();
            bottom_tube.render();
        }
    }

    render(){
        // this.context.clearRect(0, 0, this.width, this.height);
        this.context.rect(0, 0, this.width, this.height);
        this.context.fillStyle = this.background;
        this.context.fill();

        this.children.forEach(object => {
            if(!this.stop){
                if(object.mobile){
                    if(object.vy >= 10) object.vy = 10;
                    object.fall();
                    object.checkInteractions();
    
    
                HUD.update("dev", "y", Number(object.y).toFixed(2));
                HUD.update("dev", "velocity",  Number(object.vy).toFixed(2));
                HUD.update("dev", "flyState",  object.flyState);
    
                } else{
                    object.move();
                }
            } else {
                HUD.update("dev", "score", "Game over");
            }

            object.render();
        });

        requestAnimationFrame(this.render);
    }
}



class WorldObject{
    constructor({x = 0, y = 0, width = 10, height = 10, body = "red", mobile = false} = {}){
        this.x = x;
        this.y = y;

        this.vx = 0;
        this.vy = 0;

        this.stop = false;

        this.width = width;
        this.height = height;

        this.mobile = mobile;

        this.body = body;
        this.worldRef = null;
    }

    addToWorld(worldRef){
        worldRef.children.unshift(this);
        this.worldRef = worldRef;
    }
    
    moveTo(x, y){
        this.x = x;
        this.y = y;
    }
    
    fall(){
        if(this.worldRef){
            this.vy += 1;
            this.y += this.vy;
        }

        if(this.isOverScreen()) {
            this.centrize();
            this.vy = 0;
        }
    }

    render(){
        let context = this.worldRef.context;

        context.fillStyle = this.body;
        context.fillRect(this.x, this.y, this.width, this.height);
    }
}



class Tube extends WorldObject{
    constructor({x = 0, y = 0, width = 80, height = 150} = {}){
        super({x, y, width, height});
        
        this.body = "green";
        this.mobile = false;
    }

    move(){
        this.x = this.x - this.worldRef.speed;

        if(this.isTubeOverScreen()) this.x = this.worldRef.width;
    }

    isTubeOverScreen(){
        return this.x + this.width < 0;
    }
}



class Bird extends WorldObject{
    constructor({x = 0, y = 0, width = 10, height = 10, flySpeed = 2} = {}){
        super({x, y, width, height, mobile: true});
        
        this.body = "red";
        this.flySpeed = flySpeed;

        this.flyState = 3;

        this.vx = 0;
        this.vy = 1;
    }

    reset(){
        if(this.worldRef){
            this.x = this.worldRef.width / 2 - (this.width / 2);
            this.y = this.worldRef.height / 2 - (this.width / 2);
        }
    }

    isOverScreen(){
        return this.y + this.height > this.worldRef.height;
    }


    fly(){
        let n = (40 / this.flyState);
        this.vy = (Math.abs(this.vy) * - 1) * n;

        if(this.vy <= -10)  this.vy = -10;

        this.flyState -= 1;
        if(this.flyState == 0){
            this.flyState = 3;
            this.vy = (Math.abs(this.vy) * - 1)
        }
    }

    checkInteractions(){
        let barriers = this.worldRef.getAllBarriers();

        barriers.forEach(barrier => {
            if(Utils.isRectIntersects(this, barrier)) {
                this.worldRef.stop = true;
            }

            //score counting
            if(this.x == (barrier.x + barrier.width) - 1){
                this.worldRef.score+= 0.5; // 0.5 for each barrier (top and bottom :) )
                HUD.update("dev", "score", this.worldRef.score);

            }
        });

        
    }

    centrize(){
        this.x = BlySky.width / 2 - (this.width / 2);
        this.y  = BlySky.height / 2 - (this.height / 2);
    }
}



let BlySky = new World({
    background: "#00B5E2"
});

let RedBlock = new Bird({
    width: 30,
    height: 25,
});

RedBlock.addToWorld(BlySky);
RedBlock.centrize();
BlySky.generateWorldBarriers();

let HUD = new UI();

BlySky.render();

document.addEventListener("click", function(){
    RedBlock.fly();
});

document.addEventListener("keydown", function(event){
    if(event.key == " ") RedBlock.fly();    
});


console.log(BlySky)