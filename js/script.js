let videoProcess = (function(){
    let peers_connection_ids = []
    let peers_connection = []
    let remote_video_stream = []
    let remote_audio_stream = []
    let local_div;
    let audio;
    let isAudioMute = true;
    let audio_sender = []
    let video_state = {
        none: 0,
        camera: 1,
        screenshare: 2,
    }

    let video_st = video_state.none
    let videoCameraTrack;
    let serverProcess;
    async function init(SDPfuntion,myid){
        serverProcess = SDPfuntion
        myconnectionid = myid
        eventProcess()
        local_div = document.getElementById("localVideo")
    }

    function eventProcess(){
        $("#micOnOff").click(async function(){
            if(!audio){
                await loadAudio()
            }
            if(!audio){
                alert("Audio Permission Has Not Granted")
            }

            if(isAudioMute){
                audio.enabled = true
                $("#micOnOff").html('<i class="fas fa-microphone"></i>')
                updateMediaSender(audio,audio_sender)
            }else{
                audio.enabled = false
                $("#micOnOff").html('<i class="fas fa-microphone-slash"></i>')
                removeMediaSender(audio_sender)
            }
            isAudioMute = !isAudioMute
                            
        })

        $("#videoOnOff").click(async function(){
            if(video_st == video_state.camera){
                await deviceVideoProcess(video_state.none)
            }else{
                await deviceVideoProcess(video_state.camera)
            }
        })

        $("#shareOnOff").click(async function(){
            if(video_st == video_state.screenshare){
                await deviceVideoProcess(video_state.none)
            }else{
                await deviceVideoProcess(video_state.screenshare)
            }
        })
    }

    async function deviceVideoProcess(newVideoState){
        try{
            let vstream = null
            if(newVideoState == video_state.camera){
                vstream = await navigator.mediaDevices.getUserMedia({
                    video:{
                        width:1920,
                        height: 1080,
                    },
                    audio: false,
                })
            }else if(newVideoState == video_state.screenshare){
                vstream = await navigator.mediaDevices.getDisplayMedia({
                    video:{
                        width:1920,
                        height: 1080,
                    },
                    audio: false,
                })
            }
            if(vstream && vstream.getVideoTracks().length > 0){
                videoCameraTrack = vstream.getVideoTracks()[0]
                if(videoCameraTrack){
                    local_div.srcObject = new MediaStream([videoCameraTrack])
                }
            }
        }catch(err){
            console.log(err)
            return;
        }
        video_st = newVideoState
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

   async function setConnection(connetid){
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
            if(!remote_video_stream[connetid]){
                remote_video_stream[connetid] = new MediaStream()
            }
            if(!remote_audio_stream[connetid]){
                remote_audio_stream[connetid] = new MediaStream()
            }

            if(event.track.kind == "video"){
                remote_video_stream[connetid]
                .getVideoTracks()
                .forEach((t)=> remote_video_stream[connetid].removeTrack(t))

                remote_video_stream[connetid].addTrack(event.track)
                let remoteVideo = document.getElementById("video_"+connetid)
                remoteVideo.srcObject = null
                remoteVideo.srcObject = remote_video_stream[connetid]
                remoteVideo.load()
            }else if(event.track.kind == "audio"){
                remote_audio_stream[connetid]
                .getAudioTracks()
                .forEach((t)=> remote_audio_stream[connetid].removeTrack(t))

                remote_audio_stream[connetid].addTrack(event.track)
                let remoteAudio = document.getElementById("audio_"+connetid)
                remoteAudio.srcObject = null
                remoteAudio.srcObject = remote_audio_stream[connetid]
                remoteAudio.load()
            }


        }


        peers_connection_ids[connetid] = connetid
        peers_connection[connetid] = connection

        return connection
    
    }

    async function setOffer(connectionID){
        let connection = peers_connection[connetid]
        let offer = await connection.createOffer()
        await connection.setLocalDescription(offer)
        serverProcess(JSON.stringify({offer:connection.localDescription}),connectionID)
    }


    async function SDPprocess(message,from_id){
        message = JSON.parse(message)
        if(message.answer){
            await peers_connection(from_id).setRemoteDescription(new RTCSessionDescription(message.answer))
        }else if(message.offer){
            if(!peers_connection(from_id)){
                await setConnection(from_id)
            }
            await peers_connection(from_id).setRemoteDescription(new RTCSessionDescription(message.offer))
            let answer = await peers_connection(from_id).createAnswer();
            await peers_connection(from_id).setLocalDescription(answer)
            serverProcess(JSON.stringify({answer: answer}),from_id)
        }else if(message.icecandidate){
            if(!peers_connection(from_id)){
                await setConnection(from_id)
            }

            try{
                await peers_connection(from_id).addIceCandidate(message.icecandidate)
            }catch(err){
                console.log(err)
            }
        }
    }


    return {
        setNewVideoConnection: async function(connetid){
            await setConnection(connetid)
        },
        init: async function (SDPfuntion,myid){
            await init(SDPfuntion,myid)
        },
        processClient: async function(data,connid){
            await SDPprocess(data,connid)
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

        socket.on("SDPprocess",async function(data){
            await videoProcess.processClient(data.message,data.from_connid)
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

