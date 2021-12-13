let videoProcess = (function(){
    let peers_connection_ids = []
    let peers_connection = []

    let serverProcess;
    function init(SDPfuntion,myid){
        serverProcess = SDPfuntion
        myconnectionid = myid
    }

    let configaration ={
        connectionServer:[
            {
                urls:"stun:stun.l.google.com:19302"
            },
            {
                urls:"stun:stun1.l.google.com:19302"
            }
        ]
    }

    function setConnection(connetid){
        let connection = new RTCPeerConnection(configaration)


        connection.onnegotiationneeded =  async function(event){
            await setOffer(connetid)
        }

        connection.onicecandidate = function(event){
            if(event.candidate){
                serverProcess(JSON.stringify({iceCandiate: event.candidate}),connetid)
            }
        }

        connection.ontrack = function(event){

        }


        peers_connection_ids[connetid] = connetid
        peers_connection[connetid] = connection
    
    }

    async function setOffer(connectionID){
        let connection = peers_connection[connetid]
        let offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        serverProcess(JSON.stringify({offer:connection.localDescription}),connectionID)
    }


    return {
        setNewVideoConnection: async function(connetid){
            await setConnection(connetid)
        },
        init: async function (SDPfuntion,myid){
            await init(SDPfuntion,myid)
        }
    }
})()



let myvdoapp = (function(){

    function init(username,meetingid){
        userConnectionFromClient(username,meetingid)
    }

    let socket = null
    function userConnectionFromClient(username,meetingid){
        socket = io.connect()
        function SDPfunction(data,connetionId){
            socket.emit("SDPprocess",{
                message: data,
                connetionId: connetionId
            })
        }
        socket.on("connect",()=>{
            videoProcess.init(SDPfunction,socket.id)
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
            // setNewVideoConnection(dataserver.connetid)
            videoProcess.setNewVideoConnection(dataserver.connetid)
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

