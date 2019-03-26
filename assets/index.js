/* LBS组件服务 
1、初始化 - 获取当前位置
2、添加图层
3、随机函数
*/

const LBS = function (type){
    if(this.constructor.name !== 'LBS'){
        return new LBS()
    }
    this.config = {
        nowPos:[],
        radius:100,
        randomRaduis:300,
        pitch:35,
        zoom:15,
        dotNum:20
    }
    this.map = (type === '2d') ? this.init2D() : this.init3D();
    this.task = [];
    return this
}

LBS.prototype.exec = async function(){
    let task = this.task;
    while(task.length){
        try {
            await this.task.shift()(); // 顺序迭代
        } catch (error) {
            this.notify( this.verbose.EXECERROR ,error)
        }
    }
}

LBS.prototype.init2D = function(){
    try {
        return new AMap.Map('container', {
            resizeEnable: true,
            zoom:this.config.zoom,
        })
    } catch (error) {
        this.notify( this.verbose.INIT2DERROR , error )
    }
}

LBS.prototype.init3D = function(){
    try {
        return new AMap.Map('container', {
            resizeEnable: true,
            pitch:this.config.pitch, // 地图俯仰角度，有效范围 0 度- 83 度
            viewMode:'3D', // 3d模式,
            zoom:this.config.zoom
        })
    } catch (error) {
        this.notify( this.verbose.INIT3DERROR )
    }
}

/* 高精度定位 */
LBS.prototype.getPosition = function(){
    this.task.push(()=>{
        return new Promise((resolve,reject)=>{
            let pos = localStorage.getItem('nowPos');
            if(pos){
                this.config.nowPos = JSON.parse(pos)
                console.log(this.config.nowPos)
                return resolve()
            }
            this.map.plugin('AMap.Geolocation', () => {
                let geolocation = new AMap.Geolocation({
                    // 是否使用高精度定位，默认：true
                    enableHighAccuracy: true,
                    // 设置定位超时时间，默认：无穷大
                    timeout: 8000,
                    // 定位按钮的停靠位置的偏移量，默认：Pixel(10, 20)
                    buttonOffset: new AMap.Pixel(10, 20),
                    //  定位成功后调整地图视野范围使定位位置及精度范围视野内可见，默认：false
                    zoomToAccuracy: true,     
                    //  定位按钮的排放位置,  RB表示右下
                    buttonPosition: 'RB'
                })
                geolocation.getCurrentPosition()
                AMap.event.addListener(geolocation, 'complete', data => {
                    this.config.nowPos = [ data.position.R,data.position.P ];
                    localStorage.setItem('nowPos',JSON.stringify(this.config.nowPos))
                    console.log('获取定位成功')
                    console.log(this.config.nowPos)
                    resolve()
                })
                AMap.event.addListener(geolocation, 'error', err => {
                    this.notify(this.notify.GETNOWPOS,err)
                    reject()
                })
            })
        })
    })
    return this
}

LBS.prototype.addDotMarker= function(pos,ox = 0,oy = 0){
    this.task.push(()=>{
        return new Promise((resolve,reject)=>{
            let site = pos || this.config.nowPos;
            let marker = new AMap.Marker({
                icon: "http://a.amap.com/jsapi_demos/static/demo-center/icons/poi-marker-default.png", 
                position: new AMap.LngLat(...site),
                offset: new AMap.Pixel(ox, oy)
            });
            this.map.add(marker);
            resolve()
        })
    })
    return this
}

LBS.prototype.install_plugins = function(...rest){
    this.task.push(()=>{
        return new Promise((resolve,reject)=>{
            AMap.plugin(rest,(err)=>{//异步同时加载多个插件
                if(err){
                    return reject()
                }
                this.map.addControl(new AMap.ToolBar());
                resolve()
            });
        })
    })
    return this
}

LBS.prototype.addCircleArea = function(pos,radius,color,strokeColor,strokeWeight){
    this.task.push(()=>{
        return new Promise((resolve,reject)=>{
            var circle = new AMap.Circle({
                center: pos || this.config.nowPos,
                radius: this.config.radius, //半径
                borderWeight: 3,
                strokeColor: "#FF33FF", 
                strokeOpacity: 1,
                strokeWeight: 6,
                strokeOpacity: 0.2,
                fillOpacity: 0.4,
                strokeStyle: 'dashed',
                strokeDasharray: [10, 10], 
                // 线样式还支持 'dashed'
                fillColor: '#1791fc',
                zIndex: 50,
            })
            circle.setMap(this.map)
            // 缩放地图到合适的视野级别
            this.map.setFitView([ circle ]);
            resolve()
        })
    })
    return this
}

LBS.prototype.randomSpreadDots = function(){
    this.task.push(()=>{
        return new Promise((resolve,reject)=>{
            let {dotNum,randomRaduis,nowPos} = this.config;
            let arr = [];
            function random(){
                return ( ( Math.random() <= 0.5 ? -1 : 1 ) * Math.random() / zoom  ) * randomRaduis
            }
            for(;dotNum--;){
                arr.push( random() , random() )
            }
            console.log(arr)
            resolve()
            /* let dis = AMap.GeometryUtil.distance(p1, p2); */
        })
    })
    return this
}

LBS.prototype.notify = function(...rest){
    alert(rest.join(''))
}

LBS.prototype.verbose = {
    INIT3DERROR:'初始化3d模型失败',
    INIT2DERROR:'初始化2d模型失败',
    ADDBOTERROR:'添加标点失败,请传入指定参数',
    GETNOWPOS:'获取当前定位信息失败',
    EXECERROR:'执行错误'
}
/* 主要逻辑顺序 */
let lbs = LBS('2d');
lbs.randomSpreadDots().exec()
// lbs.install_plugins('AMap.ToolBar').getPosition().addCircleArea().exec()
/* lbs.getPosition().addMarkerBot().exec() */
