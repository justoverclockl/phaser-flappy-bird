import Phaser from 'phaser'

const PIPES_TO_RENDER = 4;

class PlayScene extends Phaser.Scene {
    constructor(config) {
        super('PlayScene');
        this.config = config

        this.bird = null;
        this.pipes = null;
        this.pipeHorizontalDistance = 0;
        this.pipeVerticalDistanceRange = [100, 250];
        this.horizontalDistanceRange = [500, 550];
        this.flapVelocity = 200;
        this.score = 0
        this.scoreText = ""
        this.bestScore = 0
        this.bestScoreText = ""
    }

    preload() {
        this.load.image('sky', 'assets/sky.png')
        this.load.image('bird', 'assets/bird.png')
        this.load.image('obstacle', 'assets/pipe.png')
        this.load.image('gameover', 'assets/gameover.png')
    }

    create() {
        this.createBg()
        this.createBird()
        this.createPipes()
        this.createColliders()
        this.createScore()
        this.handleInputs()
    }

    update() {
        this.checkGameStatus()
        this.recyclePipes()
    }

    createBg() {
        this.add
            .image(0, 0, 'sky')
            .setOrigin(0, 0)
    }

    createBird() {
        this.bird = this.physics.add
            .sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird')
            .setOrigin(0)

        this.bird.body.gravity.y = 600
        this.bird.setCollideWorldBounds(true)
    }

    createPipes() {
        this.pipes = this.physics.add.group()

        for (let i = 0; i < PIPES_TO_RENDER; i++) {
            const upperPipe = this.pipes
                .create(0, 0, 'obstacle')
                .setImmovable(true)
                .setOrigin(0, 1)
            const lowerPipe = this.pipes
                .create(0, 0, 'obstacle')
                .setImmovable(true)
                .setOrigin(0, 0)

            this.placePipe(upperPipe, lowerPipe)
        }

        this.pipes.setVelocityX(-200)
    }

    createColliders() {
        this.physics.add.collider(this.bird, this.pipes, this.gameOver, null, this)
    }

    createScore() {
        this.score = 0
        const bestScore = localStorage.getItem('flappyScore')
        this.scoreText = this.add.text(16, 16, `Score: ${0}`, { fontSize: '32px', fill: 'black' })

        this.bestScoreText = this.add.text(16, 50, `Best Score: ${bestScore || 0}`, { fontSize: '18px', fill: 'black' })
    }

    handleInputs() {
        this.input.on('pointerdown', this.fly, this)
        const spacebar = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
        spacebar.on('down', this.fly, this)
    }

    checkGameStatus() {
        if (this.bird.getBounds().bottom >= this.config.height || this.bird.y <= 0 ) {
            this.gameOver()
        }
    }

    placePipe(uPipe, lPipe) {
        const rightMostX = this.getRightMostPipe()
        const pipeVerticalDistance = Phaser.Math.Between(...this.pipeVerticalDistanceRange)
        const pipeVerticalPosition = Phaser.Math.Between(0 + 20, this.config.height - 20 - pipeVerticalDistance)
        const pipeHorizontalDistance = Phaser.Math.Between(...this.horizontalDistanceRange)

        uPipe.x = rightMostX + pipeHorizontalDistance
        uPipe.y = pipeVerticalPosition

        lPipe.x = uPipe.x
        lPipe.y = uPipe.y + pipeVerticalDistance
    }

    getRightMostPipe() {
        let rightMostX = 0

        this.pipes.getChildren().forEach((pipe) => {
            rightMostX = Math.max(pipe.x, rightMostX)
        })

        return rightMostX
    }

    recyclePipes() {
        const tempPipes = []

        this.pipes.getChildren().forEach((pipe) => {
            if (pipe.getBounds().right < 0) {
                tempPipes.push(pipe)

                if (tempPipes.length === 2) {
                    this.placePipe(...tempPipes)
                    this.increaseScore()
                    this.saveBestScore()
                }
            }
        })
    }

    saveBestScore() {
        const bestScoreText = localStorage.getItem('flappyScore')
        const bestScore = bestScoreText ? Number(bestScoreText) : 0

        if (!bestScore || this.score > bestScore) {
            localStorage.setItem('flappyScore', this.score)
        }
    }

    gameOver() {
        this.physics.pause()
        this.bird.setTint(0xff0000)

        this.saveBestScore()

        this.time.addEvent({
            delay: 2000,
            callback: () => {
              this.scene.restart()
            },
            loop: false
        })
    }

    fly() {
        this.bird.body.velocity.y = -this.flapVelocity
    }

    increaseScore() {
        this.score++
        this.scoreText.setText(`Score: ${this.score}`)
    }
}

export default PlayScene;