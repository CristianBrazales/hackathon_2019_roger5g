import logo from './logo.svg';
import './App.css';
import Webcam from "react-webcam";
import React, { useState } from 'react';
import ReactDOM from "react-dom";

const videoConstraints = {
  width: 1280,
  height: 720,
  facingMode: "user"
};


  const MESSAGE_ENPOINT = 'http://localhost:3000/send_img';

function App() {
  const webcamRef = React.useRef(null);
  var [divStyle, setValues] = useState({
       margin: '',
 border: ''
   });
   var [divStyle_2, setValues_2] = useState({
        margin: '',
  border: ''
    });
    var [divStyle_3, setValues_3] = useState({
         margin: '',
   border: ''
     });

     var [divStyle_4, setValues_4] = useState({
          margin: '',
    border: ''
      });



  const capture = React.useCallback(
    async () => {


      const imageSrc = webcamRef.current.getScreenshot();


     const response = await  fetch(MESSAGE_ENPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // 'Access-Control-Allow-Origin': '*',
        // 'Access-Control-Allow-Origin':  'http://localhost:3000',
        //  'Access-Control-Allow-Methods': POST,
        // 'Access-Control-Allow-Headers': Content-Type, Authorization

      },
      body: JSON.stringify({
        message: imageSrc,
      }),
    });
    var status = await response.status;
    console.log(status);
    if(status==201){

      setValues(divStyle = {
      margin: '40px',
      backgroundColor:'red'
      })
      setValues_2(divStyle_2 = {
      margin: '40px',
      backgroundColor:'white'
      })
      setValues_3(divStyle_3 = {
      margin: '40px',
      backgroundColor:'white'
      })
      setValues_4(divStyle_4 = {
      margin: '40px',
      backgroundColor:'white'
      })
    }
     if(status==202){
       setValues(divStyle = {
       margin: '40px',
       backgroundColor:'white'
       })
       setValues_2(divStyle_2 = {
       margin: '40px',
       backgroundColor:'red'
       })
       setValues_3(divStyle_3 = {
       margin: '40px',
       backgroundColor:'white'
       })
       setValues_4(divStyle_4 = {
       margin: '40px',
       backgroundColor:'white'
       })

    }
    if (status==203){
      setValues(divStyle = {
      margin: '40px',
      backgroundColor:'white'
      })
      setValues_2(divStyle_2 = {
      margin: '40px',
      backgroundColor:'white'
      })
      setValues_3(divStyle_3 = {
      margin: '40px',
      backgroundColor:'red'
      })
      setValues_4(divStyle_4 = {
      margin: '40px',
      backgroundColor:'white'
      })

    }
     if(status==204){
       setValues(divStyle = {
       margin: '40px',
       backgroundColor:'white'
       })
       setValues_2(divStyle_2 = {
       margin: '40px',
       backgroundColor:'white'
       })
       setValues_3(divStyle_3 = {
       margin: '40px',
       backgroundColor:'white'
       })
       setValues_4(divStyle_4 = {
       margin: '40px',
       backgroundColor:'red'
       })
    }
    console.log("lastone");
    capture();
    } ,   [webcamRef]
  );

  return (
    <>
    <div class="goal">
    <button style={divStyle}>Button1</button>
          <button style={divStyle_2}>Button1</button>
                <button style= {divStyle_3}>Button1</button>
                      <button style= {divStyle_4}>Button1</button>
      </div>
      <div class="webcam-video">
      <Webcam
        audio={false}
        height={720}
        ref={webcamRef}
        screenshotFormat="image/jpeg"
        width={1280}
        videoConstraints={videoConstraints}
      />
      </div>
      <button onClick={capture} style={{backgroundColor: '#0000'}} >Capture photo</button>

    </>
  );
}

export default App;
