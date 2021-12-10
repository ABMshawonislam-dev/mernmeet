let myvdoapp = (function(){

    function init(username,meetingid){
        userConnectionFromClient(username,meetingid)
    }

    let socket = null
    function userConnectionFromClient(username,meetingid){
        socket = io.connect()
        socket.on("connect",()=>{
            if(socket.connected){
              if(username != "" && meetingid != "")  {
                  socket.emit("userconnect",{
                      username:username,
                      meetingid:meetingid
                  })
              }
            }
        })

        socket.on("myinformation",(dataserver)=>{
            adduservideo(dataserver.myusername,dataserver.connetid)
        })

        function adduservideo(myusername,connetid){
            let newuservideo = $("#otherself").clone()
            newuservideo = newuservideo.attr("id",connetid).addClass("other")
            newuservideo.find("h1").text(myusername)
            newuservideo.find("video").attr("id",`video_${connetid}`)
            newuservideo.find("audio").attr("id",`audio_${connetid}`)
            newuservideo.show()
            $(".top-remote-video").append(newuservideo)

        }


    }

    return {
        init: function(username,meetingid){
            init(username,meetingid)
        }
    }
})()

