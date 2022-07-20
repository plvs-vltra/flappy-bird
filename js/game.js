class Utils {
    static getRandomNum(min = 0, max = 10){
        return Math.random() * (max - min) + min;
    }

    static getDistance(object1, object2){
        let x1 = object1.x,
            y1 = object1.y,
            x2 = object2.x,
            y2 = object2.y;

        let a = y1 - y2,
            b = x1 - x2;    

        return Math.sqrt((a*a) + (b*b));
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

            // console.log(y1, x1, x2, y2);

        return y1 + h1 > y2 // нижняя часть блока выше y второго объекта
            && x1 + w1 > x2 // правая часть блока правее x второго объекта
            && x1 < x2 + w2 // но в то же врем х блока левее лево части второго объекта
            && y1 < y2 + h2; // и в то же время у блока выше нижней части блока
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
    constructor({ background  = "black", gravity = 3, speed = 2}){
        this.canvas = document.querySelector("#screen");
        this.context = this.canvas.getContext('2d');
        this.background = background;

        this.children = [];

        this.barrierDistance = 200;

        this.barriersAmount = 1;

        this.gravity = gravity;
        this.speed = speed;

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
                    object.checkDistances();
    
    
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
        this.freeze = false;

        this.body = body;
        this.belongsToWorld = null;
    }

    addToWorld(worldRef){
        worldRef.children.unshift(this);
        this.belongsToWorld = worldRef;
    }
    
    moveTo(x, y){
        this.x = x;
        this.y = y;
    }
    
    fall(){
        if(this.belongsToWorld){
            this.vy += 1;
            this.y += this.vy;
        }

        if(this.isOverScreen()) {
            this.centrize();
            this.vy = 0;
        }
    }

    render(){
        let context = this.belongsToWorld.context;

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
        this.x = this.x - this.belongsToWorld.speed;

        if(this.isTubeOverScreen()) this.x = this.belongsToWorld.width;
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
        if(this.belongsToWorld){
            this.x = this.belongsToWorld.width / 2 - (this.width / 2);
            this.y = this.belongsToWorld.height / 2 - (this.width / 2);
        }
    }

    isOverScreen(){
        return this.y + this.height > this.belongsToWorld.height;
    }


    fly(){
        let n = (20 / this.flyState);
        this.vy = (Math.abs(this.vy) * - 1) * n;

        if(this.vy <= -10)  this.vy = -10;

        this.flyState -= 1;
        if(this.flyState == 0){
            this.flyState = 3;
            this.vy = (Math.abs(this.vy) * - 1)
        }
    }

    checkDistances(){
        let barriers = this.belongsToWorld.getAllBarriers();

        barriers.forEach(barrier => {
            // console.log(Utils.getDistance(barrier, this));
            if(Utils.isRectIntersects(this, barrier)) {
                this.belongsToWorld.stop = true;
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

// document.addEventListener("mousemove", function(event){
//     RedBlock.y = event.clientY;
// })



console.log(BlySky)