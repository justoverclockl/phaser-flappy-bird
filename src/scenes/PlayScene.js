import BaseScene from "./BaseScene";

const PIPES_TO_RENDER = 4;

class PlayScene extends BaseScene {
    constructor(config) {
        super('PlayScene', config);

        this.bird = null;
        this.pipes = null;
        this.flapVelocity = 200;
        this.score = 0
        this.scoreText = ""
        this.bestScoreText = ""
        this.isPaused = false

        this.currentDifficulty = 'easy'
        this.difficulties = {
            'easy': {
                horizontalDistanceRange: [300, 450],
                pipeVerticalDistanceRange: [150, 200]
            },
            'normal': {
                horizontalDistanceRange: [280, 330],
                pipeVerticalDistanceRange: [140, 190]
            },
            'hard': {
                horizontalDistanceRange: [270, 310],
                pipeVerticalDistanceRange: [120, 160]
            },
        }
    }

    create() {
        this.currentDifficulty = 'easy'
        super.create()
        this.createBird()
        this.createPipes()
        this.createColliders()
        this.createScore()
        this.handleInputs()
        this.createPauseButton()
        this.listenToEvents()


        this.anims.create({
            key: 'fly',
            frames: this.anims.generateFrameNumbers('bird', {
                start: 8,
                end: 15
            }),
            frameRate: 8,
            repeat: -1,
            // repeat infinitely
        })

        this.bird.play('fly')
    }

    update() {
        this.checkGameStatus()
        this.recyclePipes()
    }

    listenToEvents() {
        if (this.pauseEvent) { return; }

        this.pauseEvent = this.events.on('resume', () => {
            this.initialTime = 3
            this.countDownText = this.add.text(...this.screenCenter, 'Fly in: ' + this.initialTime, this.fontOptions).setOrigin(0.5)
            this.timedEvent = this.time.addEvent({
                delay: 1000,
                callback: this.countDown,
                callbackScope: this,
                loop: true
            })
        })
    }

    countDown() {
        this.initialTime--;
        this.countDownText.setText('Fly in: ' + this.initialTime)

        if (this.initialTime <= 0) {
            this.isPaused = false
            this.countDownText.setText('')
            this.physics.resume()
            this.timedEvent.remove()
        }
    }

    createBird() {
        this.bird = this.physics.add
            .sprite(this.config.startPosition.x, this.config.startPosition.y, 'bird')
            .setFlipX(true)
            .setOrigin(0)
            .setScale(3)

        this.bird.setBodySize(this.bird.body.width, this.bird.height - 8)

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

    createPauseButton() {
        this.isPaused = false
        const pauseButton = this.add
            .image(this.config.pauseBtnPosition.x,this.config.pauseBtnPosition.y, 'pausebtn')
            .setScale(3)
            .setOrigin(1)

        pauseButton.setInteractive(); // make btn interactive

        pauseButton.on('pointerdown', () => {
            this.isPaused = true
            this.physics.pause();
            this.scene.pause();
            this.scene.launch('PauseScene')
        })
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
        const difficulty = this.difficulties[this.currentDifficulty]
        const rightMostX = this.getRightMostPipe()
        const pipeVerticalDistance = Phaser.Math.Between(...difficulty.pipeVerticalDistanceRange)
        const pipeVerticalPosition = Phaser.Math.Between(0 + 20, this.config.height - 20 - pipeVerticalDistance)
        const pipeHorizontalDistance = Phaser.Math.Between(...difficulty.horizontalDistanceRange)

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
                    this.increaseDifficulty()
                }
            }
        })
    }

    increaseDifficulty() {
        if (this.score === 10) {
            this.currentDifficulty = 'normal'
        }

        if (this.score === 20) {
            this.currentDifficulty = 'hard'
        }
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
        if (this.isPaused) { return }
        this.bird.body.velocity.y = -this.flapVelocity
    }

    increaseScore() {
        this.score++
        this.scoreText.setText(`Score: ${this.score}`)
    }
}

export default PlayScene;