import Phaser from 'phaser'

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            debug: true,
        }
    },
    scene: {
        preload,
        create,
        update,
    }
}

const {width, height} = config;

const PIPES_TO_RENDER = 4;

let bird = null

let pipes = null

const pipeVerticalDistanceRange = [100, 250];
const horizontalDistanceRange = [500, 550];
let pipeHorizontalDistance = 0;


const flapVelocity = 200
const initialBirdPosition = { x: width * 0.1, y: height / 2 }

// loading assets - images animation etc
function preload() {
    // this context is a scene that contains
    // func and props we can use
    this.load.image('sky', 'assets/sky.png')
    this.load.image('bird', 'assets/bird.png')
    this.load.image('obstacle', 'assets/pipe.png')
}

//
function create() {
    // first value = x, second is y, third is the key of the img
    this.add
        .image(0, 0, 'sky')
        .setOrigin(0, 0) // set to the correct entry point of the canvas

    pipes = this.physics.add.group()

    for (let i = 0; i < PIPES_TO_RENDER; i++) {

        const upperPipe = pipes.create(0,0, 'obstacle')
            .setOrigin(0,1)

        const lowerPipe = pipes.create(0,0, 'obstacle')
            .setOrigin(0,0)

        placePipe(upperPipe, lowerPipe)
    }

    pipes.setVelocityX(-200)

    bird = this.physics.add
        .sprite(width / 10, height / 2, 'bird')
        .setOrigin(0)
    bird.body.gravity.y = 400

    const spaceBar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    spaceBar.on('down', fly)
}

function update() {
    if (bird.y < 0 - bird.height || bird.y > height ) {
        restartBirdPosition()
    }

    recyclePipes()
}

function placePipe(uPipe, lPipe) {

    const rightMostX = getRightMostPipe()
    const pipeVerticalDistance = Phaser.Math.Between(...pipeVerticalDistanceRange)
    const pipeVerticalPosition = Phaser.Math.Between(0 + 20, height - 20 - pipeVerticalDistance)
    const pipeHorizontalDistance = Phaser.Math.Between(...horizontalDistanceRange)

    uPipe.x = rightMostX + pipeHorizontalDistance
    uPipe.y = pipeVerticalPosition

    lPipe.x = uPipe.x
    lPipe.y = uPipe.y + pipeVerticalDistance
}

function recyclePipes() {
    const tempPipes = []
    pipes.getChildren().forEach((pipe) => {
        if (pipe.getBounds().right < 0) {
            tempPipes.push(pipe)

            if (tempPipes.length === 2) {
                placePipe(...tempPipes)
            }
        }
    })
}

function getRightMostPipe() {
    let rightMostX = 0

    pipes.getChildren().forEach((pipe) => {
        rightMostX = Math.max(pipe.x, rightMostX)
    })

    return rightMostX
}

function restartBirdPosition() {
    bird.x = initialBirdPosition.x
    bird.y = initialBirdPosition.y
    bird.body.velocity.y = 0
}

function fly() {
    bird.body.velocity.y = -flapVelocity
}

new Phaser.Game(config)

