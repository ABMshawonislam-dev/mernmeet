let myvdoapp = (function(){

    function init(userid,meetingid){
        userConnectionFromClient()
    }

    let socket = null
    function userConnectionFromClient(){
        socket = io.connect()
        socket.on("connect",()=>{
            alert("Socket from Client side")
        })
    }

    return {
        init: function(userid,meetingid){
            init(userid,meetingid)
        }
    }
})()

