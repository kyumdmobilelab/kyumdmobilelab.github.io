
var localVideo = document.getElementById("localVideo");
var localCanvas = document.getElementById("localCanvas");

/*
initialize = function() {
    localVideo = document.getElementById("localVideo");
    localCanvas = document.getElementById("localCanvas");
    try {
        navigator.getUserMedia({video:true}, onGotStream, onFailedStream);
    } catch (e) {
        alert("getUserMedia error " + e);
    }
}*/

var FaceCompX = 0;
var FaceCompY = 0;
var FaceCompWidth = 0;
var FaceCompHeight = 0;

poll = function() {
    var w = localVideo.videoWidth;
    var h = localVideo.videoHeight;
    var canvas = document.createElement('canvas');
    canvas.width  = w;
    canvas.height = h;
    var ctx = canvas.getContext('2d');
    ctx.drawImage(localVideo, 0, 0, w, h);
    var comp = ccv.detect_objects({ "canvas" : ccv.grayscale(canvas),
                                    "cascade" : cascade,
                                    "interval" : 5,
                                    "min_neighbors" : 1 });
    /* draw detected area */
    localCanvas.width = localVideo.clientWidth;
    localCanvas.height = localVideo.clientHeight;
    var ctx2 = localCanvas.getContext('2d');
    ctx2.lineWidth = 2;
    ctx2.lineJoin = "round";
    ctx2.clearRect (0, 0, localCanvas.width,localCanvas.height);
    var x_offset = 0, y_offset = 0, x_scale = 1, y_scale = 1;
    if (localVideo.clientWidth * localVideo.videoHeight > localVideo.videoWidth * localVideo.clientHeight) {
        x_offset = (localVideo.clientWidth - localVideo.clientHeight *
                    localVideo.videoWidth / localVideo.videoHeight) / 2;
    } else {
        y_offset = (localVideo.clientHeight - localVideo.clientWidth *
                    localVideo.videoHeight / localVideo.videoWidth) / 2;
    }
    x_scale = (localVideo.clientWidth - x_offset * 2) / localVideo.videoWidth;
    y_scale = (localVideo.clientHeight - y_offset * 2) / localVideo.videoHeight;

    if (comp.length > 0) {
        for (var i = 0; i < comp.length; i++) {
            FaceCompX = comp[i].x;
            FaceCompY = comp[i].y;
            FaceCompWidth = comp[i].width;
            FaceCompHeight = comp[i].height;

            comp[i].x = comp[i].x * x_scale + x_offset;
            comp[i].y = comp[i].y * y_scale + y_offset;
            comp[i].width = comp[i].width * x_scale;
            comp[i].height = comp[i].height * y_scale;
            var opacity = 0.1;
            if (comp[i].confidence > 0) {
                opacity += comp[i].confidence / 10;
                if (opacity > 1.0) opacity = 1.0;
            }
            //ctx2.strokeStyle = "rgba(255,0,0," + opacity * 255 + ")";
            ctx2.lineWidth = opacity * 10;
            ctx2.strokeStyle = "rgb(255,0,0)";
            ctx2.strokeRect(comp[i].x, comp[i].y, comp[i].width, comp[i].height);
        }
    } else {
        FaceCompX = 0;
        FaceCompY = 0;
        FaceCompWidth = 0;
        FaceCompHeight = 0;
    }
    //setTimeout(poll, 1000);
}

/*
onGotStream = function(stream) {
    localVideo.style.opacity = 1;
    localVideo.srcObject = stream;
    localStream = stream;
    setTimeout(poll, 1500);
}*/
/*
onFailedStream = function(error) {
    alert("Failed to get access to local media. Error code was " + error.code + ".");
}*/

//setTimeout(initialize, 1);


var videoSelect = document.querySelector('select#videoSource');
var selectors = [videoSelect];

navigator.mediaDevices.enumerateDevices().then(gotDevices).catch(handleError);

function gotDevices(deviceInfos) {
    // Handles being called several times to update labels. Preserve values.
    var values = selectors.map(function(select) {
        return select.value;
    });
    selectors.forEach(function(select) {
        while (select.firstChild) {
            select.removeChild(select.firstChild);
        }
    });
    for (var i = 0; i !== deviceInfos.length; ++i) {
        var deviceInfo = deviceInfos[i];
        var option = document.createElement('option');
        option.value = deviceInfo.deviceId;
        
        if (deviceInfo.kind === 'videoinput') {
            option.text = deviceInfo.label || 'camera ' + (videoSelect.length + 1);
            videoSelect.appendChild(option);
        }
    }
    
    selectors.forEach(function(select, selectorIndex) {
        if (Array.prototype.slice.call(select.childNodes).some(function(n) {
            return n.value === values[selectorIndex];
        })) {
            select.value = values[selectorIndex];
        }
    });
}

function handleError(error) {
    console.log('navigator.getUserMedia error: ', error);
}

var pollTimerId = null;

function gotStream(stream) {
    //var videoElement = document.getElementById('localVideo');
    window.stream = stream; // make stream available to console
    //videoElement.srcObject = stream;

    localVideo.style.opacity = 1;
    localVideo.srcObject = stream;
    localStream = stream;
    //setTimeout(poll, 1500);

    if (pollTimerId) {
        clearInterval(pollTimerId);
    }
    pollTimerId = setInterval(poll, 1000);

    // Refresh button list in case labels have become available
    return navigator.mediaDevices.enumerateDevices();
}

function start() {
    if (window.stream) {
        window.stream.getTracks().forEach(function(track) {
            track.stop();
        });
    }
    var videoSource = videoSelect.value;
    var constraints = {
        video: {deviceId: videoSource ? {exact: videoSource} : undefined}
    };

    navigator.mediaDevices.getUserMedia(constraints).then(gotStream).then(gotDevices).catch(handleError);

    //navigator.getUserMedia(constraints, onGotStream, onFailedStream);
}

videoSelect.onchange = start;


// start
var mainDiv = document.getElementById("mainDiv");
mainDiv.style.left = (1200/2 - 500/2) + "px";

start();
drawAnalysisCanvasLines();

//------------------------------------------

var autoFetchFaceImageTimerId = null;
var countFrequencyOfFaceDetectTimerId = null;

var myAudio = document.getElementById('myAudio');
var isMyAudioPlayHack = false;

function switchChange(e) {
    //console.log(e.checked);
    if (e.checked) {
        if (isMyAudioPlayHack === false) {
            myAudio.play();
            myAudio.pause();
            isMyAudioPlayHack = true;
        }

        countFrequencyOfFaceDetect();
    } else {
        if (autoFetchFaceImageTimerId) {
            clearInterval(autoFetchFaceImageTimerId);
        }
        if (countFrequencyOfFaceDetectTimerId) {
            clearInterval(countFrequencyOfFaceDetectTimerId);
        }
    }
}

function cameraSwitchChange(e) {
    console.log(e.checked);
    if (e.checked) {
        window.stream.getVideoTracks()[0].enabled = false;
    } else {
        start();
    }
}

function countFrequencyOfFaceDetect() {
    var detectTime = 0;

    countFrequencyOfFaceDetectTimerId  = setInterval(function(){
        let w = localVideo.videoWidth;
        let rangeW = w/4;
        let faceCenterX = FaceCompX + (FaceCompWidth/2);
    
        if ((FaceCompWidth > 50 && FaceCompHeight > 50) && (faceCenterX >= rangeW && faceCenterX <= (rangeW*3))) {
            detectTime++;
        } else {
            detectTime--;
        }

        console.log("countFrequencyOfFaceDetect, faceOutTime: " + detectTime);
        
        if (detectTime >= 2) {
            countTimeAndFetchFace();
        } else if (detectTime < 0) {
            detectTime = 0;
        }

    }, 1000);
}

function countTimeAndFetchFace() {
    if (countFrequencyOfFaceDetectTimerId) {
        clearInterval(countFrequencyOfFaceDetectTimerId);
    }

    var fetchTime = 0;
    autoFetchFaceImageTimerId = setInterval(function(){
        if (fetchTime >= 12) {
            if (autoFetchFaceImageTimerId) {
                clearInterval(autoFetchFaceImageTimerId);
                document.getElementById('countSecond').innerText = "";

                if (document.getElementById('switch_checkbox').checked) {
                    countFrequencyOfFaceDetect();
                }
                
                return;
            }
        } else {
            fetchTime++;
            autoFetchFaceImage();
        }

    }, 1000);
}

function autoFetchFaceImage() {
    console.log("w:" + FaceCompWidth);
    console.log("h:" + FaceCompHeight);

    document.getElementById('countSecond').innerText = "嘗試抓取臉部，請靠近鏡頭..."

    let w = localVideo.videoWidth;
    let rangeW = w/4;
    let faceCenterX = FaceCompX + (FaceCompWidth/2);

    if (FaceCompWidth > 50 && FaceCompHeight > 50) {
        if (faceCenterX >= rangeW && faceCenterX <= (rangeW*3)) {
            myAudio.play();
            takeSnapshotBtuuon_click();
        }
    }
}

function takeSnapshotBtuuon_click() {
    if (countFrequencyOfFaceDetectTimerId) {
        clearInterval(countFrequencyOfFaceDetectTimerId);
    }

    if (autoFetchFaceImageTimerId) {
        clearInterval(autoFetchFaceImageTimerId);
        document.getElementById('countSecond').innerText = "";
    }

    document.getElementById('panelDiv').style.display = 'none';
    document.getElementById('progressDiv').style.display = 'block';
    document.getElementById('otherDiv').style.display = 'block';
    document.getElementById('otherMsgTitle').style.display = 'none';
    document.getElementById('chooseCameraDiv').style.display = 'none';
    document.getElementById('frameDiv').style.backgroundColor = '#f8f8f8';
    document.getElementById('bgbgImage').style.display = 'none';
    document.getElementById('cameraSwitch').style.display = 'none';

    const myFirstPromise = new Promise((resolve, reject) => {
        // 執行一些非同步作業，最終呼叫:
        //
        //   resolve(someValue); // 實現
        // 或
        //   reject("failure reason"); // 拒絕

        let myvideo = document.getElementById('localVideo');
        
        let tempCanvas = document.createElement('canvas');
        let context = tempCanvas.getContext('2d');
    
        let x = FaceCompX - (FaceCompWidth/4);
        let y = FaceCompY - (FaceCompHeight/4)
        let width = FaceCompWidth + (FaceCompWidth/4)*2;
        let height = FaceCompHeight + (FaceCompHeight/5)*3;
    
        tempCanvas.width = width;
        tempCanvas.height = height;
    
        context.drawImage(myvideo, x, y, width, height, 0, 0, width, height);
        let imageData = context.canvas.toDataURL("image/png");
        document.getElementById('faceImage').src = imageData;

        resolve(context);
    });

    myFirstPromise.then(clipImageDone, null);
}

function clipImageDone(context) {
    context.canvas.toBlob(function(blob) {
        setTimeout(function(){
            processImage(blob);
        }, 500);
    });
}


function againDetectBtuuon_click() {
    if (showResultCountTimerId) {
        clearInterval(showResultCountTimerId);
    }

    $('#mainDiv').hide();
    $('#recommendDiv').hide();

    mainDiv.style.left = (1200/2 - 500/2) + "px";

    $('#mainDiv').slideDown();

    document.getElementById('panelDiv').style.display = 'block';
    document.getElementById('progressDiv').style.display = 'none';
    document.getElementById('otherDiv').style.display = 'none';
    document.getElementById('resultDiv').style.display = 'none';
    document.getElementById('frameDiv').style.borderWidth = '0px';

    document.getElementById('frameDiv').style.backgroundColor = '#f8f8f8';
    
    document.getElementById('bgbgImage').style.display = 'none';;

    document.getElementById('againDetectBtuuon').style.display = 'none';
    document.getElementById('showResultTimeCount').style.display = 'none';
    document.getElementById('chooseCameraDiv').style.display = 'block';
    //document.getElementById('recommendDiv').style.display = 'none';
    document.getElementById('cameraSwitch').style.display = 'block';

    document.getElementById('analysisTitle').style.display = 'none';
    document.getElementById('myProperty1').style.display = "none";
    document.getElementById('myProperty2').style.display = "none";
    document.getElementById('myProperty3').style.display = "none";
    document.getElementById('myProperty4').style.display = "none";
    document.getElementById('myProperty5').style.display = "none";
    document.getElementById('myProperty6').style.display = "none";

    document.getElementById('analysisCanvas').style.display = "none";

    if (document.getElementById('switch_checkbox').checked) {
        countFrequencyOfFaceDetect();
    }
}

var showResultCountTimerId = null;

function showResultValues() {
    var countTime = 15;

    showResultCountTimerId = setInterval(function(){
        if (countTime < 6) {
            document.getElementById('showResultTimeCount').innerText = countTime + " 秒後關閉分析結果...";
            document.getElementById('showResultTimeCount').style.display = 'block';
        }
        if (countTime < 0) {
            againDetectBtuuon_click();
        }
        countTime--;
    }, 1000);


    if (!resultJSON) {
        countTime = 1;
        document.getElementById('otherMsgTitle').innerText = "[ 分析失敗!! ]";
        document.getElementById('otherMsgTitle').style.color = "#3C3C3C";
        document.getElementById('otherMsgTitle').style.display = 'block';
        document.getElementById('progressDiv').style.display = 'none';
        document.getElementById('againDetectBtuuon').style.display = 'block';
        return;
    }

    let info = resultJSON["faceAttributes"];

    if (info) {
        document.getElementById('otherMsgTitle').innerText = "[ 分析結果 ]";
        document.getElementById('otherMsgTitle').style.color = "#FCFCFC";
    } else {
        countTime = 1;
        document.getElementById('otherMsgTitle').innerText = "[ 分析失敗!! ]";
        document.getElementById('otherMsgTitle').style.color = "#3C3C3C";
        document.getElementById('otherMsgTitle').style.display = 'block';
        document.getElementById('progressDiv').style.display = 'none';
        document.getElementById('againDetectBtuuon').style.display = 'block';
        return;
    }


    document.getElementById('smileValue').innerText = "微笑指數: " + info["smile"];

    let gender = info["gender"];
    if (gender === "male") {
        document.getElementById('genderValue').innerHTML = "&nbsp;男性&nbsp;";
    } else if (gender === "female") {
        document.getElementById('genderValue').innerHTML = "&nbsp;女性&nbsp;";
    }

    document.getElementById('ageValue').innerHTML = "&nbsp;" + info["age"] + "歲&nbsp;";

    let glasses = info['glasses'];
    if (glasses === "NoGlasses") {
        document.getElementById('glassesValue').innerText = "有無眼鏡: 無";
    } else if (glasses === "ReadingGlasses") {
        document.getElementById('glassesValue').innerText = "有無眼鏡: 有，一般眼鏡";
    } else if (glasses === "Sunglasses") {
        document.getElementById('glassesValue').innerText = "有無眼鏡: 有，墨鏡";
    } else if (glasses === "SwimmingGoggles") {
        document.getElementById('glassesValue').innerText = "有無眼鏡: 有，泳鏡";
    }

    let emotionInfo = info['emotion'];
    document.getElementById('angerValue').innerText = "憤怒指數: " + emotionInfo["anger"];
    document.getElementById('contemptValue').innerText = "鄙視指數: " + emotionInfo["contempt"];
    document.getElementById('disgustValue').innerText = "嫌惡指數: " + emotionInfo["disgust"];
    document.getElementById('fearValue').innerText = "恐懼指數: " + emotionInfo["fear"];
    document.getElementById('happinessValue').innerText = "幸福指數: " + emotionInfo["happiness"];
    document.getElementById('neutralValue').innerText = "中立指數: " + emotionInfo["neutral"];
    document.getElementById('sadnessValue').innerText = "悲傷指數: " + emotionInfo["sadness"];
    document.getElementById('surpriseValue').innerText = "驚訝指數: " + emotionInfo["surprise"];

    //--------
    let aData = {
        "gender" : info["gender"],
        "age" : info["age"],
        "smile" : info["smile"],
        "glasses" : info['glasses'],
        "anger" : emotionInfo["anger"],
        "contempt" : emotionInfo["contempt"],
        "disgust" : emotionInfo["disgust"],
        "fear" : emotionInfo["fear"],
        "happiness" : emotionInfo["happiness"],
        "neutral" : emotionInfo["neutral"],
        "sadness" : emotionInfo["sadness"],
        "surprise" : emotionInfo["surprise"]
    };


    $('#mainDiv').hide();
    mainDiv.style.left = "50px";

    analysisData(aData);

    $('#mainDiv').slideDown();
    $('#recommendDiv').slideDown();

    document.getElementById('progressDiv').style.display = 'none';
    document.getElementById('resultDiv').style.display = 'block';
    document.getElementById('otherMsgTitle').style.display = 'block';
    document.getElementById('frameDiv').style.borderWidth = '1px';
    document.getElementById('againDetectBtuuon').style.display = 'block';
    document.getElementById('bgbgImage').style.display = 'block';

    settingMyProperties();
    settingRecommendTable(aData);
}

function drawAnalysisCanvasLines() {
    let aCanvas =document.getElementById("analysisCanvas");
    let ctx = aCanvas.getContext("2d");

    // title
    ctx.beginPath();
    ctx.lineWidth = 4;
    ctx.strokeStyle = '#FF5151';
    ctx.moveTo(40,109);
    ctx.lineTo(160,109);
    ctx.lineTo(190,135);
    ctx.stroke();

    // 1
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(20,186);
    ctx.lineTo(116,186);
    ctx.lineTo(143,205);
    ctx.stroke();

    // 2
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(325,145);
    ctx.lineTo(342,126);
    ctx.lineTo(445,126);
    ctx.stroke();

    // 3
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(13,266);
    ctx.lineTo(116,266);
    ctx.lineTo(145,259);
    ctx.stroke();

    // 4
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(358,235);
    ctx.lineTo(392,217);
    ctx.lineTo(488,217);
    ctx.stroke();

    // 5
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(62,356);
    ctx.lineTo(175,356);
    ctx.lineTo(210,325);
    ctx.stroke();
    
    // 6
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#FFFF93';
    ctx.moveTo(320,308);
    ctx.lineTo(350,333);
    ctx.lineTo(465,333);
    ctx.stroke();
}


//------------------------------------------
//--------------- Face API -----------------
//------------------------------------------

var resultJSON = null; 

function processImage(imageBlob) {
    // **********************************************
    // *** Update or verify the following values. ***
    // **********************************************

    // Replace the subscriptionKey string value with your valid subscription key.
    var subscriptionKey = "000d2bdb2bbc441c8859254a2f52e08e";


    // Replace or verify the region.
    //
    // You must use the same region in your REST API call as you used to obtain your subscription keys.
    // For example, if you obtained your subscription keys from the westus region, replace
    // "westcentralus" in the URI below with "westus".
    //
    // NOTE: Free trial subscription keys are generated in the westcentralus region, so if you are using
    // a free trial subscription key, you should not need to change this region.
    

    //var uriBase = "https://westcentralus.api.cognitive.microsoft.com/face/v1.0/detect";
    var uriBase = "https://eastasia.api.cognitive.microsoft.com/face/v1.0/detect"


    // Request parameters.
    var params = {
        "returnFaceId": "true",
        "returnFaceLandmarks": "false",
        "returnFaceAttributes": "age,gender,headPose,smile,facialHair,glasses,emotion,hair,makeup,occlusion,accessories,blur,exposure,noise",
    };

    // Perform the REST API call.
    $.ajax({
        url: uriBase + "?" + $.param(params),
        // Request headers.
        beforeSend: function(xhrObj){
            xhrObj.setRequestHeader("Content-Type","application/octet-stream");
            xhrObj.setRequestHeader("Ocp-Apim-Subscription-Key", subscriptionKey);
        },
        type: "POST",
        processData: false,
        // Request body.
        data: imageBlob
    })
    .done(function(data) {
        // Show formatted JSON on webpage.
        console.log("Detect done.");
        console.log(JSON.stringify(data, null, 2));

        resultJSON = data[0];
        showResultValues();
    })
    .fail(function(jqXHR, textStatus, errorThrown) {
        // Display error message.
        let errorString = (errorThrown === "") ? "Error. " : errorThrown + " (" + jqXHR.status + "): ";
        errorString += (jqXHR.responseText === "") ? "" : (jQuery.parseJSON(jqXHR.responseText).message) ? 
            jQuery.parseJSON(jqXHR.responseText).message : jQuery.parseJSON(jqXHR.responseText).error.message;
        console.log(errorString);

        resultJSON = null;
        showResultValues();
    });
}

//------------------------------------------


//----------------------------------------------------
//---------------------- Data ------------------------
// aData = {
//     "gender"    : 性別
//     "age"       : 年齡
//     "smile"     : 微笑
//     "glasses"   : 眼鏡
//     "anger"     : 憤怒
//     "contempt"  : 鄙視
//     "disgust"   : 嫌惡
//     "fear"      : 恐懼
//     "happiness" : 幸福
//     "neutral"   : 中立
//     "sadness"   : 悲傷
//     "surprise"  : 驚訝
// }

function analysisData(data) {
    if (data["gender"] === "male") {
        analysisMale(data);
    } else if (data["gender"] === "female") {
        analysisFemale(data);
    }
    document.getElementById('analysisTitle').style.display = 'block';
}

function analysisMale(data) {
    if (data["age"] > 75) {
        // 陽光老人、幸福老人、時髦老人、和藹老人
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光老人";
        } else if (data["happiness"] > 0.15) {
            document.getElementById('analysisTitle').innerHTML = "幸福老人";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦老人";
        } else {
            document.getElementById('analysisTitle').innerHTML = "和藹老人";
        }
    } else if (data["age"] > 65 && data["age"] <= 75) {
        // 開朗爺爺、時髦爺爺、爺爺
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "開朗爺爺";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦爺爺";
        } else {
            document.getElementById('analysisTitle').innerHTML = "爺爺";
        }
    } else if (data["age"] > 50 && data["age"] <= 65) {
        // 陽光阿伯、時髦阿伯、用功阿伯、一位阿伯
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光阿伯";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦阿伯";
        } else if (data["glasses"] === "ReadingGlasses") {
            document.getElementById('analysisTitle').innerHTML = "用功阿伯";
        } else {
            document.getElementById('analysisTitle').innerHTML = "一位阿伯";
        }
    } else if (data["age"] > 40 && data["age"] <= 50) {
        // 憂鬱大叔、凶神惡煞、大俠、黑社會大哥、大老闆、學者、陽光大叔
        // 雜魚大叔、無名路人
        if (data["sadness"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "憂鬱大叔";
        } else if (data["anger"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "凶神惡煞";
        } else if (data["glasses"] === "Sunglasses") {
            if (data["smile"] > 0.15) {
                document.getElementById('analysisTitle').innerHTML = "大俠";
            } else {
                document.getElementById('analysisTitle').innerHTML = "黑社會大哥";
            }
        } else if (data["glasses"] === "ReadingGlasses") {
            if (data["neutral"] < 0.7) {
                document.getElementById('analysisTitle').innerHTML = "大老闆";
            } else {
                document.getElementById('analysisTitle').innerHTML = "學者";
            }
        } else if (data["smile"] > 0.2) {
            document.getElementById('analysisTitle').innerHTML = "陽光大叔";
        } else {
            let maxNum = 1;  
            let minNum = 0;  
            let n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
            let array = ["雜魚大叔", "無名路人"];
            document.getElementById('analysisTitle').innerHTML = array[n];
        }
    } else if (data["age"] > 15 && data["age"] <= 40) {
        // 憂鬱小生、小流氓、帥氣青年、耍酷男孩、年輕有為、文青、陽光大男孩
        // 雜魚小弟、無名路人、了無生趣
        if (data["sadness"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "憂鬱小生";
        } else if (data["anger"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "小流氓";
        } else if (data["glasses"] === "Sunglasses") {
            if (data["smile"] > 0.15){
                document.getElementById('analysisTitle').innerHTML = "帥氣青年";
            } else {
                document.getElementById('analysisTitle').innerHTML = "耍酷男孩";
            }
        } else if (data["glasses"] === "ReadingGlasses") {
            if (data["neutral"] < 0.7) {
                document.getElementById('analysisTitle').innerHTML = "年輕有為";
            } else {
                document.getElementById('analysisTitle').innerHTML = "文青";
            }
        } else if (data["smile"] > 0.2) {
            document.getElementById('analysisTitle').innerHTML = "陽光大男孩";
        } else {
            let maxNum = 1;  
            let minNum = 0;  
            let n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
            let array = ["雜魚小弟", "無名路人"];
            document.getElementById('analysisTitle').innerHTML = array[n];
        }
    } else if (data["age"] <= 15) {
        // 陽光小男孩、好學生、小屁孩、乖小孩
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光小男孩";
        } else if (data["glasses"] === "ReadingGlasses") {
            document.getElementById('analysisTitle').innerHTML = "好學生";
        } else if (data["disgust"] > 0.1 || data["anger"] > 0.1 || data["contempt"] > 0.1) {
            document.getElementById('analysisTitle').innerHTML = "小屁孩";
        } else {
            document.getElementById('analysisTitle').innerHTML = "乖小孩";
        }
    }
}


function analysisFemale(data) {
    if (data["age"] > 75) {
        // 陽光婆婆、幸福婆婆、時髦婆婆、和藹婆婆
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光婆婆";
        } else if (data["happiness"] > 0.15) {
            document.getElementById('analysisTitle').innerHTML = "幸福婆婆";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦婆婆";
        } else {
            document.getElementById('analysisTitle').innerHTML = "和藹婆婆";
        }
    } else if (data["age"] > 65 && data["age"] <= 75) {
        // 開朗阿婆、時髦阿婆、阿婆
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "開朗阿婆";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦阿婆";
        } else {
            document.getElementById('analysisTitle').innerHTML = "阿婆";
        }
    } else if (data["age"] > 50 && data["age"] <= 65) {
        // 陽光大嬸、時髦大嬸、用功大嬸、一位大嬸
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光大嬸";
        } else if (data["glasses"] === "Sunglasses") {
            document.getElementById('analysisTitle').innerHTML = "時髦大嬸";
        } else if (data["glasses"] === "ReadingGlasses") {
            document.getElementById('analysisTitle').innerHTML = "用功大嬸";
        } else {
            document.getElementById('analysisTitle').innerHTML = "一位大嬸";
        }
    } else if (data["age"] > 40 && data["age"] <= 50) {
        // 憂鬱阿姨、憤怒阿姨、女俠、新潮美魔女、女強人、氣質美女、陽光大嬸
        // 雜魚大姊、無名路人、了無生趣
        if (data["sadness"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "憂鬱阿姨";
        } else if (data["anger"] > 0.4) {
            document.getElementById('analysisTitle').innerHTML = "憤怒阿姨";
        } else if (data["glasses"] === "Sunglasses") {
            if (data["smile"] > 0.15){
                document.getElementById('analysisTitle').innerHTML = "女俠";
            } else {
                document.getElementById('analysisTitle').innerHTML = "新潮美魔女";
            }
        } else if (data["glasses"] === "ReadingGlasses") {
            if (data["neutral"] < 0.7) {
                document.getElementById('analysisTitle').innerHTML = "女強人";
            } else {
                document.getElementById('analysisTitle').innerHTML = "氣質美女";
            }
        } else if (data["smile"] > 0.2) {
            document.getElementById('analysisTitle').innerHTML = "陽光大嬸";
        } else {
            let maxNum = 2;  
            let minNum = 0;  
            let n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
            let array = ["雜魚大姊", "無名路人", "了無生趣"];
            document.getElementById('analysisTitle').innerHTML = array[n];
        }
    } else if (data["age"] > 15 && data["age"] <= 40) {
        // 多愁少女、恰北北、時尚美女、前衛少女、文藝少女、氣質少女、妙齡美女
        // 雜魚妹妹、無名路人、了無生趣
        if (data["sadness"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "多愁少女";
        } else if (data["anger"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "恰北北";
        } else if (data["glasses"] === "Sunglasses") {
            if (data["smile"] > 0.15){
                document.getElementById('analysisTitle').innerHTML = "時尚美女";
            } else {
                document.getElementById('analysisTitle').innerHTML = "前衛少女";
            }
        } else if (data["glasses"] === "ReadingGlasses") {
            if (data["neutral"] < 0.7) {
                document.getElementById('analysisTitle').innerHTML = "文藝少女";
            } else {
                document.getElementById('analysisTitle').innerHTML = "氣質少女";
            }
        } else if (data["smile"] > 0.2) {
            document.getElementById('analysisTitle').innerHTML = "妙齡美女";
        } else {
            let maxNum = 2;  
            let minNum = 0;  
            let n = Math.floor(Math.random() * (maxNum - minNum + 1)) + minNum;  
            let array = ["雜魚妹妹", "無名路人", "了無生趣"];
            document.getElementById('analysisTitle').innerHTML = array[n];
        }
    } else if (data["age"] <= 15) {
        // 陽光小女孩、好學生、小屁孩、乖小孩
        if (data["smile"] > 0.3) {
            document.getElementById('analysisTitle').innerHTML = "陽光小女孩";
        } else if (data["glasses"] === "ReadingGlasses") {
            document.getElementById('analysisTitle').innerHTML = "好學生";
        } else if (data["disgust"] > 0.1 || data["anger"] > 0.1 || data["contempt"] > 0.1) {
            document.getElementById('analysisTitle').innerHTML = "小屁孩";
        } else {
            document.getElementById('analysisTitle').innerHTML = "乖小孩";
        }
    }
}

function settingMyProperties() {
    let str = document.getElementById('analysisTitle').innerHTML;
    let array = [];

    // 陽光老人、幸福老人
    // 陽光婆婆、幸福婆婆
    if (str === "陽光老人" ||
        str === "幸福老人" ||
        str === "陽光婆婆" ||
        str === "幸福婆婆")
    {
        array[0] = '熱愛戶外';
        array[1] = '情緒開朗';
        array[2] = '溫柔';
        array[3] = '毋須煩惱';
        array[4] = '家庭和樂';
        array[5] = '幸福美滿';
    }
    // 時髦老人、時髦婆婆
    if (str === "時髦老人" ||
        str === "時髦婆婆")
    {
        array[0] = '熱愛出遊';
        array[1] = '內心開明';
        array[2] = '很會打扮';
        array[3] = '老當益壯';
        array[4] = '公平正義';
        array[5] = '比個讚';
    }
    // 和藹老人、和藹婆婆
    if (str === "和藹老人" || 
        str === "和藹婆婆")
    {
        array[0] = '和藹可親';
        array[1] = '情緒平穩';
        array[2] = '古稀之年';
        array[3] = '返老還童';
        array[4] = '七老八十';
        array[5] = '兒孫滿堂';
    }



    // 開朗爺爺
    if (str === "開朗爺爺" ||
        str === "開朗阿婆" )
    {
        array[0] = '多多運動';
        array[1] = '笑口常開';
        array[2] = '愛家';
        array[3] = '彩衣娛親';
        array[4] = '年屆古稀';
        array[5] = '毋須煩惱';
    }
    // 時髦爺爺
    if (str === "時髦爺爺" ||
        str === "時髦阿婆")
    {
        array[0] = '喜歡出遊';
        array[1] = '跟上時代';
        array[2] = '年輕的心';
        array[3] = '年屆古稀';
        array[4] = '老玩童';
        array[5] = '彩衣娛親';
    }
    // 爺爺
    if (str === "爺爺" ||
        str === "阿婆")
    {
        array[0] = '出外走走';
        array[1] = '多多運動';
        array[2] = '年屆古稀';
        array[3] = '保持微笑';
        array[4] = '寶刀未老';
        array[5] = '人生開始';
    }



    // 陽光阿伯、陽光大嬸
    if (str === "陽光阿伯" || 
        str === "陽光大嬸")
    {
        array[0] = '陽光開朗';
        array[1] = '健步如飛';
        array[2] = '愛家';
        array[3] = '喜好娛樂';
        array[4] = '熱心公益';
        array[5] = '毋須煩惱';
    }
    // 時髦阿伯、時髦大嬸
    if (str === "時髦阿伯" || 
        str === "時髦大嬸")
    {
        array[0] = '出外踏青';
        array[1] = '彩衣娛親';
        array[2] = '比個讚';
        array[3] = '氣質出眾';
        array[4] = '愛家';
        array[5] = '人生開始';
    }
    // 用功阿伯、用功大嬸
    if (str === "用功阿伯" || 
        str === "用功大嬸")
    {
        array[0] = '喜歡閱讀';
        array[1] = '多多出遊';
        array[2] = '蒸蒸日上';
        array[3] = '氣質出眾';
        array[4] = '有點老花';
        array[5] = '時來運轉';
    }
    // 一位阿伯、一位大嬸
    if (str === "一位阿伯" || 
        str === "一位大嬸")
    {
        array[0] = '廣結善緣';
        array[1] = '腳麻照跑';
        array[2] = '顧家';
        array[3] = '家庭和樂';
        array[4] = '愛管閒事';
        array[5] = '路見不平';
    }



    // 憂鬱大叔、憂鬱阿姨、憂鬱小生、多愁少女
    if (str === "憂鬱大叔" ||
        str === "憂鬱阿姨" ||
        str === "憂鬱小生" ||
        str === "多愁少女")
    {
        array[0] = '宅在家裡';
        array[1] = '情緒灰暗';
        array[2] = '戀家';
        array[3] = '喜歡電玩';
        array[4] = '多愁多慮';
        array[5] = '安全第一';
    }

    // 凶神惡煞、小流氓、憤怒阿姨、恰北北
    if (str === "凶神惡煞" ||
        str === "小流氓" ||
        str === "憤怒阿姨" ||
        str === "恰北北")
    {
        array[0] = '行事急切';
        array[1] = '情緒高亢';
        array[2] = '不常在家';
        array[3] = '需要朋友';
        array[4] = '怒氣沖沖';
        array[5] = '沒人敢惹';
    }

    // 大俠、帥氣青年、女俠、時尚美女
    if (str === "大俠" ||
        str === "帥氣青年" ||
        str === "女俠" ||
        str === "時尚美女")
    {
        array[0] = '愛好和平';
        array[1] = '情緒愉快';
        array[2] = '愛家';
        array[3] = '很會打扮';
        array[4] = '個性開朗';
        array[5] = '仗義直言';
    }

    // 黑社會大哥、耍酷男孩、新潮美魔女、前衛少女
    if (str === "黑社會大哥" ||
        str === "耍酷男孩" ||
        str === "新潮美魔女" ||
        str === "前衛少女")
    {
        array[0] = '追求流行';
        array[1] = '情緒鎮定';
        array[2] = '愛家';
        array[3] = '很會掙錢';
        array[4] = '時代前端';
        array[5] = '思想開放';
    }

    // 大老闆、年輕有為、女強人、文藝少女
    if (str === "大老闆" ||
        str === "年輕有為" ||
        str === "女強人" ||
        str === "文藝少女")
    {
        array[0] = '愛好工作';
        array[1] = '情緒尚可';
        array[2] = '顧家';
        array[3] = '喜歡賺錢';
        array[4] = '求新求變';
        array[5] = '人緣不錯';
    }

    // 學者、文青、氣質美女、氣質少女
    if (str === "學者" ||
        str === "文青" ||
        str === "氣質美女" ||
        str === "氣質少女")
    {
        array[0] = '知識份子';
        array[1] = '情緒快活';
        array[2] = '顧家';
        array[3] = '追求新知';
        array[4] = '喜歡閱讀';
        array[5] = '積極正面';
    }

    // 陽光大叔、陽光大男孩、陽光大嬸、妙齡美女
    if (str === "陽光大叔" ||
        str === "陽光大男孩" ||
        str === "陽光大嬸" ||
        str === "妙齡美女")
    {
        array[0] = '熱愛戶外';
        array[1] = '情緒開朗';
        array[2] = '溫柔';
        array[3] = '無憂無慮';
        array[4] = '愛開玩笑';
        array[5] = '幸運兒';
    }

    // 雜魚大叔、雜魚小弟、雜魚大姊、雜魚妹妹
    if (str === "雜魚大叔" ||
        str === "雜魚小弟" ||
        str === "雜魚大姊" ||
        str === "雜魚妹妹")
    {
        array[0] = '個性圓融';
        array[1] = '惜字如金';
        array[2] = '一個好人';
        array[3] = '戀家';
        array[4] = '設定目標';
        array[5] = '沒有特色';
    }

    // 無名路人、了無生趣
    if (str === "無名路人" ||
        str === "了無生趣") 
    {
        array[0] = '沒有情趣';
        array[1] = '心如止水';
        array[2] = '愛家';
        array[3] = '情緒平穩';
        array[4] = '一個好人';
        array[5] = '設定目標';
    }

    // 陽光小男孩、陽光小女孩
    if (str === "陽光小男孩" ||
        str === "陽光小女孩" )
    {
        array[0] = '喜歡郊遊';
        array[1] = '情緒開朗';
        array[2] = '溫柔';
        array[3] = '無憂無慮';
        array[4] = '受人疼愛';
        array[5] = '開心果';
    }
    // 好學生
    if (str === "好學生") {
        array[0] = '用功讀書';
        array[1] = '尊師重道';
        array[2] = '成績不錯';
        array[3] = '頭腦聰明';
        array[4] = '勇往直前';
        array[5] = '設定目標';
    }
    
    // 小屁孩
    if (str === "小屁孩") {
        array[0] = '勇往直前';
        array[1] = '不怕權威';
        array[2] = '嘴巴很賤';
        array[3] = '不受控制';
        array[4] = '欠揍';
        array[5] = '白目';
    }
    
    // 乖小孩
    if (str === "乖小孩") {
        array[0] = '欠缺特色';
        array[1] = '情緒乖巧';
        array[2] = '聽話';
        array[3] = '令人疼愛';
        array[4] = '設定目標';
        array[5] = '繼續加油';
    }


    // display:
    document.getElementById('myProperty1').innerText = array[0];
    document.getElementById('myProperty2').innerText = array[1];
    document.getElementById('myProperty3').innerText = array[2];
    document.getElementById('myProperty4').innerText = array[3];
    document.getElementById('myProperty5').innerText = array[4];
    document.getElementById('myProperty6').innerText = array[5];

    document.getElementById('myProperty1').style.display = "block";
    document.getElementById('myProperty2').style.display = "block";
    document.getElementById('myProperty3').style.display = "block";
    document.getElementById('myProperty4').style.display = "block";
    document.getElementById('myProperty5').style.display = "block";
    document.getElementById('myProperty6').style.display = "block";

    document.getElementById('analysisCanvas').style.display = "block";
}


function settingRecommendTable(data) {
    if (data["age"] > 50) {
        //1
        document.getElementById('rImg1').src = 'images/ginkgo.jpg';
        document.getElementById('rName1').innerHTML = '銀杏';
        document.getElementById('rPrice1').innerHTML = '原價 2000 元，<br/>現在特價<strong> 1499 </strong>元。';

        //2
        document.getElementById('rImg2').src = 'images/readingglasses.jpg';
        document.getElementById('rName2').innerHTML = '老花眼鏡';
        document.getElementById('rPrice2').innerHTML = '原價 1500 元，<br/>現在特價<strong> 1099 </strong>元。';

        //3
        document.getElementById('rImg3').src = 'images/crutch.jpg';
        document.getElementById('rName3').innerHTML = '伸缩拐杖老人手杖';
        document.getElementById('rPrice3').innerHTML = '原價 3500 元，<br/>現在特價<strong> 2999 </strong>元。';

        //4
        document.getElementById('rImg4').src = 'images/lanew01.jpg';
        document.getElementById('rName4').innerHTML = 'Lanew 健走鞋';
        document.getElementById('rPrice4').innerHTML = '原價 3000 元，<br/>現在特價<strong> 2490 </strong>元。';

        //5
        document.getElementById('rImg5').src = 'images/Swiss_watch.jpg';
        document.getElementById('rName5').innerHTML = '瑞士手錶';
        document.getElementById('rPrice5').innerHTML = '原價 34500 元，<br/>現在特價<strong> 30000 </strong>元。';
    }
    else if (data["age"] >= 40) {
        //1
        document.getElementById('rImg1').src = 'images/chewing_gum.jpg';
        document.getElementById('rName1').innerHTML = '記憶力增強口香糖';
        document.getElementById('rPrice1').innerHTML = '原價 150 元，<br/>現在特價<strong> 99 </strong>元。';

        //2
        document.getElementById('rImg2').src = 'images/leather_shoes01.jpg';
        document.getElementById('rName2').innerHTML = '高級皮鞋';
        document.getElementById('rPrice2').innerHTML = '原價 2500 元，<br/>現在特價<strong> 2049 </strong>元。';

        //3
        document.getElementById('rImg3').src = 'images/book.jpg';
        document.getElementById('rName3').innerHTML = '《怦然心動的人生整理魔法》';
        document.getElementById('rPrice3').innerHTML = '原價 250 元，<br/>現在特價<strong> 188 </strong>元。';

        //4
        document.getElementById('rImg4').src = 'images/perfume.jpg';
        document.getElementById('rName4').innerHTML = '香水';
        document.getElementById('rPrice4').innerHTML = '原價 1200 元，<br/>現在特價<strong> 1000 </strong>元。';

        //5
        document.getElementById('rImg5').src = 'images/Set_clothes.jpg';
        document.getElementById('rName5').innerHTML = '高級套裝';
        document.getElementById('rPrice5').innerHTML = '原價 3200 元，<br/>現在特價<strong> 2950 </strong>元。';
    }
    else if (data["age"] >= 30) {
        //1
        document.getElementById('rImg1').src = 'images/Set_clothes02.jpg';
        document.getElementById('rName1').innerHTML = '運動套裝';
        document.getElementById('rPrice1').innerHTML = '原價 1800 元，<br/>現在特價<strong> 1249 </strong>元。';

        //2
        document.getElementById('rImg2').src = 'images/jogging_shoes.jpg';
        document.getElementById('rName2').innerHTML = '慢跑鞋';
        document.getElementById('rPrice2').innerHTML = '原價 1500 元，<br/>現在特價<strong> 1099 </strong>元。';

        //3
        document.getElementById('rImg3').src = 'images/digital_watch.JPG';
        document.getElementById('rName3').innerHTML = '電子運動錶';
        document.getElementById('rPrice3').innerHTML = '原價 6500 元，<br/>現在特價<strong> 5000 </strong>元。';

        //4
        document.getElementById('rImg4').src = 'images/vitamin.jpg';
        document.getElementById('rName4').innerHTML = '維他命C';
        document.getElementById('rPrice4').innerHTML = '原價 990 元，<br/>現在特價<strong> 790 </strong>元。';

        //5
        document.getElementById('rImg5').src = 'images/book.jpg';
        document.getElementById('rName5').innerHTML = '《怦然心動的人生整理魔法》';
        document.getElementById('rPrice5').innerHTML = '原價 250 元，<br/>現在特價<strong> 188 </strong>元。';
    } 
    else {
        //1
        document.getElementById('rImg1').src = 'images/coke.jpg';
        document.getElementById('rName1').innerHTML = '可口可樂';
        document.getElementById('rPrice1').innerHTML = '原價 100 元，<br/>現在特價<strong> 89 </strong>元。';

        //2
        document.getElementById('rImg2').src = 'images/sunglasses.jpg';
        document.getElementById('rName2').innerHTML = '新潮墨鏡';
        document.getElementById('rPrice2').innerHTML = '原價 1500 元，<br/>現在特價<strong> 990 </strong>元。';

        //3
        document.getElementById('rImg3').src = 'images/book.jpg';
        document.getElementById('rName3').innerHTML = '《怦然心動的人生整理魔法》';
        document.getElementById('rPrice3').innerHTML = '原價 250 元，<br/>現在特價<strong> 188 </strong>元。';

        //4
        document.getElementById('rImg4').src = 'images/sneakers.jpg';
        document.getElementById('rName4').innerHTML = '喬丹籃球鞋';
        document.getElementById('rPrice4').innerHTML = '原價 5000 元，<br/>現在特價<strong> 3990 </strong>元。';

        //5
        document.getElementById('rImg5').src = 'images/t-shirt.jpg';
        document.getElementById('rName5').innerHTML = '名牌潮T';
        document.getElementById('rPrice5').innerHTML = '原價 1200 元，<br/>現在特價<strong> 890 </strong>元。';
    }
}
