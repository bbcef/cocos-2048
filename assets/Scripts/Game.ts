import { _decorator, Component, EventKeyboard, EventTouch, game, input, Input, instantiate, KeyCode, Label, macro, Node, Prefab, sys, SystemEvent, systemEvent, tween, Vec3 } from 'cc';
import { Grid } from "./Grid"
const { ccclass, property } = _decorator;

const GRID_SIZE = 4
const DURATION = 0.1
const MOVE_DISTANCE = 10
const KEY_SCORE_BEST = 'KEY_SCORE_BEST'
@ccclass('Game')
export class Game extends Component {
    @property(Node)
    private bgNode: Node = null
    @property(Node)
    private rootNode: Node = null

    @property({ type: Prefab })
    public gridPrefab: Prefab | null = null;

    @property(Label)
    private lblScoreNow: Label = null
    @property(Label)
    private lblScoreBest: Label = null



    private grids: Grid[][] = []
    private gridsReversed: Grid[][] = []
    private _moving = false
    private _canTouchMove = false

    private _scoreNow: number = 0 // 当前分数
    private _scoreBest: number  // 最高分数

    private _panelFailed: Node
    private initPanelFailed() {
        this._panelFailed = this.node.getChildByName('panelFailed')
        this._panelFailed.active = false

        this._panelFailed.getChildByName('btnOk').on('click', () => game.restart())
    }
    private move(grids: Grid[]) {
        let lastIdx = grids.length - 1
        let lastNum = grids[lastIdx].num

        for (let i = grids.length - 2; i >= 0; i--) {
            const grid = grids[i]
            if (!grid.num) continue

            const lastGrid = grids[lastIdx]
            const num = grid.num

            if (!lastNum) {//最后一个格子是空格子，直接往后移动
                this._moving = true
                lastNum = num

                grid.stopTween()
                tween(grid.node).
                    to(DURATION, { position: new Vec3(lastGrid.pos.x, lastGrid.pos.y) }).
                    call(() => {
                        lastGrid.num = num
                        grid.reset()
                    }).start()
            } else if (lastNum == num) {//数字一样合并
                this._moving = true
                lastIdx -= 1 //合并后不能再次合并，最后一个格子往前移动一个位置并设置为空格子
                lastNum = 0

                grid.stopTween()
                tween(grid.node).
                    to(DURATION, { position: new Vec3(lastGrid.pos.x, lastGrid.pos.y) }).
                    call(() => {
                        this.addScore(num * 2)
                        lastGrid.num = num * 2
                        grid.reset()
                        tween(lastGrid.node).
                            to(DURATION * 0.4, { scale: new Vec3(1.1, 1.1, 1.1) }).
                            delay(DURATION * 0.2).
                            to(DURATION * 0.3, { scale: new Vec3(1, 1, 1) }).start()
                    }).start()
            } else {//下面有数字但不一样
                if (i + 1 == lastIdx) {//不能往下移动
                    lastIdx = i
                    lastNum = num
                } else {//往最后格子的上一个格子移动
                    this._moving = true
                    lastIdx -= 1
                    lastNum = num

                    const lastPrevGrid = grids[lastIdx]

                    grid.stopTween()
                    tween(grid.node).
                        to(DURATION, { position: new Vec3(lastPrevGrid.pos.x, lastPrevGrid.pos.y) }).
                        call(() => {
                            lastPrevGrid.num = num
                            grid.reset()
                        }).start()
                }
            }
        }
    }
    onTouchMove(event: EventTouch) {
        if (!this._canTouchMove || this._moving) return

        const start = event.getStartLocation()
        const cur = event.getLocation()

        // const diff = cur.sub(start)

        const diff = cur.subtract(start)
        if (Math.abs(diff.x) > Math.abs(diff.y)) {
            if (Math.abs(diff.x) < MOVE_DISTANCE) return
            this._canTouchMove = false
            diff.x > 0 ? this.moveRight() : this.moveLeft()
        } else {
            if (Math.abs(diff.y) < MOVE_DISTANCE) return
            this._canTouchMove = false
            diff.y > 0 ? this.moveUp() : this.moveDown()
        }
    }
    private moveUp() {
        this.gridsReversed.forEach(itemsTmp => this.move(itemsTmp.slice().reverse()))
        this.onMoveAfter()
    }

    private moveDown() {
        this.gridsReversed.forEach(items => this.move(items))
        this.onMoveAfter()
    }

    private moveLeft() {
        this.grids.forEach(itemsTmp => this.move(itemsTmp.slice().reverse()))
        this.onMoveAfter()
    }

    private moveRight() {
        this.grids.forEach(items => this.move(items))
        this.onMoveAfter()
    }

    private addScore(score: number) {
        this._scoreNow += score
        if (this._scoreNow > this._scoreBest) {
            this._scoreBest = this._scoreNow
            sys.localStorage.setItem(KEY_SCORE_BEST, JSON.stringify(this._scoreBest))
        }
        this.showScore()
    }

    private showScore() {
        this.lblScoreNow.string = this._scoreNow.toString()
        this.lblScoreBest.string = this._scoreBest.toString()
    }


    private onKeyDown(event: EventKeyboard) {
        if (this._moving) return

        if (event.keyCode == KeyCode.ARROW_UP) {
            this.moveUp()
        } else if (event.keyCode == KeyCode.ARROW_DOWN) {
            this.moveDown()
        } else if (event.keyCode == KeyCode.ARROW_LEFT) {
            this.moveLeft()
        } else if (event.keyCode == KeyCode.ARROW_RIGHT) {
            this.moveRight()
        }
    }
    private onMoveAfter() {
        if (!this._moving) return

        this.scheduleOnce(() => {
            this._moving = false
            this.randGrid()
            this.checkFail()
        }, DURATION)
    }
    private randGrid() {
        const randGrids: Grid[] = []
        for (const rowGrids of this.grids) {
            for (const grid of rowGrids) {
                if (!grid.num) randGrids.push(grid)
            }
        }
        const grid = randGrids[this.randRange(0, randGrids.length - 1)]
        grid.num = 2
        grid.node.setScale(0, 0, 0)
        let scales = new Vec3(1, 1, 1)
        tween(grid.node).to(DURATION, { scale: scales }).start()
    }


    // 整数范围随机 [min, max]
    private randRange(min: number, max: number): number {
        return Math.round(Math.random() * (max - min) + min)
    }
    protected onStart(): void {
        this.randGrid()
        this.randGrid()
        this.node.on(Node.EventType.TOUCH_START, (_et: any) => this._canTouchMove = true, this)
        this.node.on(Node.EventType.TOUCH_MOVE, this.onTouchMove, this)
        input.on(Input.EventType.KEY_DOWN, this.onKeyDown, this)
        game.canvas.focus()
    }
    private init() {
        let idx = 0
        for (let col = 0; col < GRID_SIZE; col++) {
            this.grids[col] = []
            for (let row = 0; row < GRID_SIZE; row++) {
                const grid = instantiate(this.gridPrefab)
                grid.parent = this.rootNode
                grid.active = false
                const gridComp = grid.getComponent(Grid)
                gridComp.init(this.bgNode.children[idx].getPosition())

                // grid.active = true
                // gridComp.num = Math.pow(2, idx + 1)

                this.grids[col][row] = gridComp
                idx++
            }
        }

        this.gridPrefab.destroy()

        for (let col = 0; col < GRID_SIZE; col++) {
            this.gridsReversed[col] = []
            for (let row = 0; row < GRID_SIZE; row++) {
                this.gridsReversed[col][row] = this.grids[row][col]
            }
        }
        this._scoreBest = parseInt(sys.localStorage.getItem(KEY_SCORE_BEST) ?? '0')
        this.showScore()

        const btnRestart = this.node.getChildByName('btnRestart')
        btnRestart.on('click', async () => await game.restart())
        this.initPanelFailed()
    }

    private checkFail() {
        const gridList = [this.grids, this.gridsReversed]
        for (const grids of gridList) {
            for (const items of grids) {
                for (let i = 1; i < items.length; i++) {
                    if (!items[i].num || !items[i - 1].num || items[i].num == items[i - 1].num) return
                }
            }
        }

        this._moving = true
        this.scheduleOnce(() => this._panelFailed.active = true, 1)
    }
    start() {
        this.init()
        this.onStart()
    }

    update(deltaTime: number) {

    }
}


