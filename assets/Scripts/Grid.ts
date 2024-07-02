import { _decorator, Color, Component, Label, Node, Sprite, TweenSystem, Vec3 } from 'cc';
const { ccclass, property } = _decorator;
const COLORS = ['#ECE0D5', '#EBDCC2', '#F4A873', '#F18151', '#F1654D', '#F0462D', '#9A8032', '#F4CD50', '#78C93A', '#C9963A', '#C2BC2F', '#E64AA4', '#37C377', '#0CF694', '#35B8B5', '#984DD9']

@ccclass('Grid')
export class Grid extends Component {
    private lblNum: Label
    private _num: number = 0
    public get num(): number { return this._num }
    public set num(val: number) {
        this._num = val
        this.lblNum.string = val.toString()
        this.setColor()
    }

    private _pos: Vec3
    public get pos(): Vec3 { return this._pos }


    public init(pos: Vec3) {
        this.lblNum = this.node.getComponentInChildren(Label)
        this._pos = pos
        this.node.active = false
        this.node.setPosition(pos)
    }

    public reset() {
        this._num = 0
        this.node.active = false
        this.node.setPosition(this._pos)
    }

    public stopTween() {
        TweenSystem.instance.ActionManager.removeAllActionsFromTarget(this.node)
        this.node.setScale(1, 1, 1)
    }


    private setColor() {
        if (!this.node.active) {
            this.node.active = true
        }
        // this.node.getComponent(Sprite).color = this._num <= 4 ? Color.BLACK : Color.WHITE
        this.lblNum.node.getComponent(Label).color = this._num <= 4 ? Color.BLACK : Color.WHITE
        let idx = Math.log2(this._num)
        idx = idx == COLORS.length ? COLORS.length - 1 : idx - 1
        this.node.getComponent(Sprite).color = new Color().fromHEX(COLORS[idx])
    }
    // start() {
    //     // let po = new Vec3(0, 0, 0)
    //     // this.init(po)
    // }

    // update(deltaTime: number) {

    // }
}


