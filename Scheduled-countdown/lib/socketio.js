// var scheduledTimes = require('../public/scheduledTimes.json');
var scheduledTimesBackup = require('../public/admin-settings-backup.json');
var adminSettingsJson = require('../public/admin-settings.json');
var myip = adminSettingsJson.ipsettings.ipadress;
//var ip = require("ip");
const fs = require('fs');
var startTimeArray = [""];
var startTitleHolder = "";
var startTitleArray = [""];
var startTimeTextHolder = "";
var cueLengthArray = [""];
var cueLengthTextHolder = "";
var offsetTimeInit = [];
//--- newly added BOOLS
var cueBoolArray = [""];
var cueBoolHolder = "";

var fiveBoolArray = [""];
var fiveBoolHolder = [""];
var sendMin_To_countDownBoole = 100;
//--------------------------------------------------
const dayOfWeek = require('../lib/dayOfWeek');
var scheduleBool;
async function useScheduleBool(){
  const data = await dayOfWeek.get();
  if (data===0) {
    scheduleBool=false;
  }else(scheduleBool=true)
}
//--------------------------------------------------

//--from Script.js
var offsetTimeInit = 0;
var scheduledTimesArray = [];
var scheduledTimesArraylength = 0;
var offsetTimejson = [];
//--------------------------------------------------
var countDown = 7; // how many minutes before
countDown = countDown * 60000; // convert to Ms
var countUp = 2; // how many minutes after
countUp = countUp * 60000; // convert to M
var offsetTime = 0;

var nowInMs = 0;
var setTimeoutTime = 150;
const sleep = (waitTimeInMs) => new Promise(resolve => setTimeout(resolve, waitTimeInMs));
var newArrayIndex = 0;

var serverNewDate = "";
var serverNowInMs = "";

var centerTextContent = "";
var myIpArray = "";
var getNetworkIPs = (function() {
  var ignoreRE = /^(127\.0\.0\.1|::1|fe80(:1)?::1(%.*)?)$/i;

  var exec = require('child_process').exec;
  var cached;
  var command;
  var filterRE;

  switch (process.platform) {
    case 'win32':
      //case 'win64': // TODO: test
      command = 'ipconfig';
      filterRE = /\bIPv[46][^:\r\n]+:\s*([^\s]+)/g;
      break;
    case 'darwin':
      command = 'ifconfig';
      filterRE = /\binet\s+([^\s]+)/g;
      // filterRE = /\binet6\s+([^\s]+)/g; // IPv6
      break;
    default:
      command = 'ifconfig';
      filterRE = /\binet\b[^:]+:\s*([^\s]+)/g;
      // filterRE = /\binet6[^:]+:\s*([^\s]+)/g; // IPv6
      break;
  }

  return function(callback, bypassCache) {
    if (cached && !bypassCache) {
      callback(null, cached);
      return;
    }
    // system call
    exec(command, function(error, stdout, sterr) {
      cached = [];
      var ip;
      var matches = stdout.match(filterRE) || [];
      //if (!error) {
      for (var i = 0; i < matches.length; i++) {
        ip = matches[i].replace(filterRE, '$1')
        if (!ignoreRE.test(ip)) {
          cached.push(ip);
        }
      }
      //}
      callback(error, cached);
    });
  };
})();
getNetworkIPs(function(error, ip) {
  myIpArray = ip
  console.log("Log All ips from Socket", myIpArray);

  if (error) {
    console.log('error:', error);
  }
}, false);



//-------------------------------------------------------------------------
// MIDI
var smpteString;
var smpteMs;
var midi_ProgramChange;
var midi_Channel;
var useMIDI_ProgramChange = adminSettingsJson.timeSettings.useMIDI_ProgramChange;

function mtcTOString() {
  var JZZ = require('jzz');
  var port = JZZ().openMidiIn(1);
  var smpte = JZZ.SMPTE();
  var midi = JZZ.MIDI();
  console.log(JZZ.info());
  port
    .connect(function(msg) {
      smpte.read(msg);
      smpteString = smpte.toString();
      smpteMs = timeStringToMs(smpteString);
      if (msg.toString().includes("Program Change")) {
        midi_Channel = msg[0]-191;
        midi_ProgramChange = msg[1];
        midiTriggerCountDown();
      }

    });
};
mtcTOString();
var midiTriggerCountDownCounter=0;
function midiTriggerCountDown(){

  var offsetTime = newOffsetTime();
  var startTime = newCurrentTimeInMs() + countDown;
  startTime += offsetTime;

  var d = new Date(newCurrentTimeInMs() + countDown);
  var s = "";
  s += (10 > d.getHours() ? "0" : "") + d.getHours() + ":";
  s += (10 > d.getMinutes() ? "0" : "") + d.getMinutes() + ":";
  s += (10 > d.getSeconds() ? "0" : "") + d.getSeconds();

  if (midiTriggerCountDownCounter===0 && useMIDI_ProgramChange!=0) {
      midiTriggerCountDownCounter++;
      startTimeTextHolder = s;
      startTitleHolder = scheduledTimesArray.schedule[midi_ProgramChange].title;
    };
    if (midi_ProgramChange===127 && useMIDI_ProgramChange!=0) {
      var a = new Date(newCurrentTimeInMs() - countUp);
      d = a;

      var s = "";
      s += (10 > d.getHours() ? "0" : "") + d.getHours() + ":";
      s += (10 > d.getMinutes() ? "0" : "") + d.getMinutes() + ":";
      s += (10 > d.getSeconds() ? "0" : "") + d.getSeconds();

      startTimeTextHolder = s;
      midiTriggerCountDownCounter = 0;
      console.log("d efter  = "+d);

    };

  }
//-------------------------------------------------------------------------
function jsonReader(filePath, cb) {
  fs.readFile(filePath, (err, fileData) => {
    if (err) {
      return cb && cb(err)
    }
    try {
      const object = JSON.parse(fileData)
      return cb && cb(null, object)
    } catch (err) {
      return cb && cb(err)
    }
  })
}

//Uppdaterad
function updateScheduledTimesjson() {
  var path = './public/admin-settings.json';
  jsonReader(path, (err, adminSettings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }

    if (adminSettings.schedule.length > startTitleArray.length) {
      var a = adminSettings.schedule.length - 1;
      adminSettings.schedule.splice(a, 1);

      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].title = startTitleArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].startTime = startTimeArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].cueLength = cueLengthArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].cueBool = cueBoolArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].fiveBool = fiveBoolArray[i]
      }

    } else {

      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].title = startTitleArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].startTime = startTimeArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].cueLength = cueLengthArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].cueBool = cueBoolArray[i]
      }
      for (let i = 0; i < adminSettings.schedule.length; i++) {
        adminSettings.schedule[i].fiveBool = fiveBoolArray[i]
      };

    };

    adminSettings.schedule.sort(function(a, b) {
      return a.startTime.localeCompare(b.startTime);
    });

    fs.writeFile(path, JSON.stringify(adminSettings, null, 4), (err) => {
      if (err) console.log('Error writing file:', err)
    })
  })
};
//Uppdaterad
function updateOffsetTimePlusjson() {

  jsonReader('./public/admin-settings.json', (err, settings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }

    settings.timeSettings.offsetTime += 1;

    fs.writeFile('./public/admin-settings.json', JSON.stringify(settings, null, 4), (err) => {
      if (err) console.log('Error writing file:', err)
    })
  })


};
function updateOffsetTimeMinusjson() {


  jsonReader('./public/admin-settings.json', (err, settings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }

    settings.timeSettings.offsetTime -= 1;
    fs.writeFile('./public/admin-settings.json', JSON.stringify(settings, null, 4), (err) => {
      if (err) console.log('Error writing file:', err)
    })
  })

};
function updateOffsetTimeResetjson() {


  jsonReader('./public/admin-settings.json', (err, settings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }

  settings.timeSettings.offsetTime = 0;
    sleep(1000).then(() => {
      fs.writeFile('./public/admin-settings.json', JSON.stringify(settings, null, 4), (err) => {
        if (err) console.log('Error writing file:', err)
      })
    });

  })

};
//Uppdaterad
function loadDefaultjson() {
  var path = './public/admin-settings.json';
  getscheduledTimes();

  fs.writeFile(path, JSON.stringify(scheduledTimesBackup, null, 4), (err) => {
    if (err) throw err;
  });
};
//Uppdaterad
function writeDefaultjson() {
  var path = './public/admin-settings.json';
  var pathBackup = './public/admin-settings-backup.json';
  jsonReader(path, (err, adminSettings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }
    fs.writeFile(pathBackup, JSON.stringify(adminSettings, null, 4), (err) => {
      if (err) console.log('Error writing file:', err)
    })
  })
};
function getOffsetTimejson() {
  jsonReader('./public/admin-settings.json', (err, settings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }
    offsetTimejson = settings.timeSettings.offsetTime;
  })
  return
};
//Uppdaterad
function addNewRowDefault() {
    var path = './public/admin-settings.json';
  console.log("addNewRowDefault knappen funkar");
  var addString = "";

  fs.readFile(path, function(err, data) {
    var json = JSON.parse(data);
    var feed = {
      title: "New row added",
      startTime: "12:00",
      cueLength: "00:01:10"
    };

    json.schedule.push(feed);
    console.log("addNewRowDefault: " + JSON.stringify(json, null, 4));
    json.schedule.sort(function(a, b) {
      return a.startTime.localeCompare(b.startTime);
    });
    addString = JSON.stringify(json, null, 4);
    console.log("addNewRowDefault: " + JSON.stringify(json, null, 4));

  });

  sleep(1000).then(() => {
    fs.writeFile(path, addString, (err) => {
      if (err) throw err;
    });
  });
};
getOffsetTimejson();
//Uppdaterad
function getscheduledTimes() {
    var path = './public/admin-settings.json';

  console.log("--------------------> Socket getscheduledTimes <--------------------  " + newCurrentTime());
  jsonReader(path, (err, adminSettings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }

    scheduledTimesArray = adminSettings;
    scheduledTimesArraylength = adminSettings.schedule.length;

    for (let i = 0; i < adminSettings.schedule.length; i++) {
      startTitleArray[i] = adminSettings.schedule[i].title
    }
    for (let i = 0; i < adminSettings.schedule.length; i++) {
      startTimeArray[i] = adminSettings.schedule[i].startTime
    }
    for (let i = 0; i < adminSettings.schedule.length; i++) {
      cueLengthArray[i] = adminSettings.schedule[i].cueLength
    }
    for (let i = 0; i < adminSettings.schedule.length; i++) {
      cueBoolArray[i] = adminSettings.schedule[i].cueBool
    }
    for (let i = 0; i < adminSettings.schedule.length; i++) {
      fiveBoolArray[i] = adminSettings.schedule[i].fiveBool
    }

  })
};
getscheduledTimes();

//-------------------------------------------------------------------------

var socket_io = require('socket.io');
var io = socket_io();
var socketio = {};
socketio.io = io;
var users = [];

io.on('connection', function(socket) {

  console.log('A user connected = ' + socket.handshake.address);

  // My sockets
  //--------------------------------------------------
  socket.on("start", function(data) {
    io.emit("updatingDB");
  });
  socket.on("user", function(data) {
    checkIfUserExist(data.user);

  });

  socket.on("getTimeCode", function(data) {
    io.emit("sendTimeCode", {
      smpteString: smpteString,
      smpteMs: smpteMs,
      midi_ProgramChange: midi_ProgramChange,
      midi_Channel:midi_Channel
    });
    //mtcTOString();
  });

  socket.on("sendDB_To_Socket", function(data) {
    //console.log("sendDB_To_Socket:"+ JSON.stringify(data) )
    io.emit("sendDB_TO_Main", {
      socketDBArray: data
    });
    io.emit("sendDB_TO_Admin", {
      socketDBArray: data
    });
  });
  socket.on("writeToScheduledTimesjson", function(data) {
    console.log("--------------------> writeToScheduledTimesjson <--------------------");
    startTitleArray = data.startTitleArray;
    startTimeArray = data.startTimeArray;
    cueLengthArray = data.cueLengthArray;
    cueBoolArray = data.cueBoolArray;
    fiveBoolArray = data.fiveBoolArray;

    // console.log(fiveBoolArray);

    updateScheduledTimesjson();

  });
  socket.on("updateScheduledTimesArray", function(data) {
    console.log("--------------------> updateScheduledTimesArray <--------------------");
    io.emit("updateDB_From_Socket", {
      startTitleArray: startTitleArray,
      startTimeArray: startTimeArray,
      cueLengthArray: cueLengthArray,
      cueBoolArray: cueBoolArray,
      fiveBoolArray: fiveBoolArray
    });
  });
  socket.on("updateOffsetTimePlus", function(data) {
    console.log("updateOffsetTime: " + data.offsetTime);
    offsetTimeInit = data.offsetTime;
    console.log(offsetTimeInit);
    updateOffsetTimePlusjson();
    io.emit("updateOffsetTime_From_Socket", {
      offsetTime: offsetTimeInit
    });
  });
  socket.on("updateOffsetTimeMinus", function(data) {
    console.log("updateOffsetTimeMinus: " + data.offsetTime);
    offsetTimeInit = data.offsetTime;
    console.log(offsetTimeInit);
    updateOffsetTimeMinusjson();
    io.emit("updateOffsetTime_From_Socket", {
      offsetTime: offsetTimeInit
    });
  });
  socket.on("updateOffsetTimeReset", function(data) {
    console.log("updateOffsetTimeReset: " + data.offsetTime);
    offsetTimeInit = data.offsetTime;
    console.log(offsetTimeInit);
    updateOffsetTimeResetjson();
    io.emit("updateOffsetTime_From_Socket", {
      offsetTime: offsetTimeInit
    });
  });
  socket.on("loadDefaultToSocket", function(data) {
    console.log("loadDefaultToSocket: " + data.message);
    loadDefaultjson();

    sleep(10).then(() => {
      io.emit("pushGetscheduledTimes", {
        offsetTime: offsetTimeInit
      });
      io.emit("loadDefault_From_Socket", {
        offsetTime: offsetTimeInit
      });
    });

  });
  socket.on("writeDefaultToSocket", function(data) {
    console.log("writeDefaultToSocket: " + data.startTimeArray);

    startTimeArray = data.startTimeArray;
    startTitleArray = data.startTitleArray;
    cueLengthArray = data.cueLengthArray;
    cueBoolArray = data.cueBoolArray;
    fiveBoolArray = data.fiveBoolArray;

    writeDefaultjson();
  });
  socket.on("fiveMinPageLoad_To_Socket", function(data) {
    // console.log(data.countDownTime);
    io.emit("sendMin_To_countDown", {
      countDownTime: data
    });
  });
  socket.on("fiveMinPageStart", function(data) {

  });
  socket.on("updatebutton_To_Socket", function(data) {
    io.emit("updatebutton_From_Socket", {})
  })
  socket.on("sortingButton_To_Socket", function(data) {
    io.emit("sortingButton_From_Socket", {})
  })
  socket.on("send_Delete_Button_To_Socket", function(data) {
    deleteRowFromSchedule(data.listIndex);
    // listIndex = data.listIndex
    // console.log("send_Delete_Button_To_Socket: listIndex= " + listIndex);
    // io.emit("send_Delete_Button_from_Socket", {
    //   listIndex: listIndex
    // })
  })
  socket.on("send_Delete_CueButton_To_Socket", function(data) {
    console.log("send_Delete_CueButton_To_Socket: listIndex= " + data.listIndex);
    deleteCueRowFromUser(data.user,data.listIndex);
  })

  socket.on("send_addNewRow_To_Socket", function(data) {
    console.log("send_addNewRow_To_Socket:");
    addNewRowDefault();
  })
  io.emit("sendIpArrayToAdminPage", {
    myIpArray: myIpArray
  })
  socket.on("sendChosenIp_To_Socket", function(data) {
    console.log("sendChosenIp_To_Socket:-------------------------------- ", data.myChosenIp);

    //----------



    jsonReader('./public/admin-settings.json', (err, adminSettings) => {
      if (err) {
        console.log('Error reading file:', err)
        return
      }
      console.log("sendChosenIp_To_Socket: adminSettings");
      console.log(adminSettings.ipsettings.ipadress);
      adminSettings.ipsettings.ipadress = data.myChosenIp;


      fs.writeFile('./public/admin-settings.json', JSON.stringify(adminSettings, null, 4), (err) => {
        if (err) console.log('Error writing file:', err)
      })
    })



  })
  socket.on("reloadFiveMinCountDown", function(data) {
    console.log("reloadFiveMinCountDown");
    fiveBoolHolder = 1;
    sendMin_To_countDownBoole = 100;
    newCountDown();
    // io.emit("sendMin_To_countDown", {
    //   countDownTime: 0
    // });
  })
  socket.on("force5MinCountDownCase", function(data) {
    console.log("force5MinCountDownCase");
    //newCountDown();
    console.log(data.case);
    io.emit("sendMin_To_countDown", {
      countDownTime: data.case
    });
  })
  socket.on("AddNewCueRow", function(data) {
    console.log("AddNewCueRow");
    addNewCueRowToUser(data.user);
  })

  socket.on("startUrl", function(data) {
    console.log("startUrl = "+data.text);
    io.emit("alertText_startUrl", {
      text: data.text
    })
  })
  socket.on("adminUrl", function(data) {
    console.log("adminUrl = "+data.text);
    io.emit("alertText_adminUrl", {
      text: data.text
    })
  })
  socket.on("fohUrl", function(data) {
    console.log("fohUrl = "+data.text);
    io.emit("alertText_fohUrl", {
      text: data.text
    })
  })
  socket.on("stageUrl", function(data) {
    console.log("stageUrl = "+data.text);
    io.emit("alertText_stageUrl", {
      text: data.text
    })
  })
  socket.on("watchUrl", function(data) {
    console.log("watchUrl = "+data.text);
    io.emit("alertText_watchUrl", {
      text: data.text
    })
  })
  socket.on("countdownUrl", function(data) {
    console.log("countdownUrl = "+data.text);
    io.emit("alertText_countdownUrl", {
      text: data.text
    })
  })
  socket.on("allUsersUrl", function(data) {
    console.log("allUsersUrl = "+data.text);
    io.emit("alertText_allUsersUrl", {
      text: data.text
    })
  })

  io.emit("alertText_startUrl_stop", {})
  io.emit("alertText_adminUrl_stop", {})
  io.emit("alertText_fohUrl_stop", {})
  io.emit("alertText_stageUrl_stop", {})
  io.emit("alertText_watchUrl_stop", {})
  io.emit("alertText_countdownUrl_stop", {})
  io.emit("alertText_allUsersUrl_stop", {})



});

//--------------------------------------------------
//- CurrentTime
//--------------------------------------------------
//Uppdaterad
function newTimeArraySorting() {
  useScheduleBool();
  //--------------------------------------------------
  //---Get next title / StartTime / cueLength
  //--------------------------------------------------
  sleep(500).then(() => {
    if (newArrayIndex < scheduledTimesArraylength && useMIDI_ProgramChange===0 && scheduleBool) {
      var time = scheduledTimesArray.schedule[newArrayIndex].startTime
      var timInMs = 0;

      var d = new Date();
      var dd = new Date(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${time}`);

      if (nowInMs > ((dd.getTime() + newOffsetTime()) + countUp)) {
        newArrayIndex++;
      } else {
        startTitleHolder = scheduledTimesArray.schedule[newArrayIndex].title;
        startTimeTextHolder = scheduledTimesArray.schedule[newArrayIndex].startTime;
        cueLengthTextHolder = scheduledTimesArray.schedule[newArrayIndex].cueLength;

        cueBoolHolder = scheduledTimesArray.schedule[newArrayIndex].cueBool;
        fiveBoolHolder = scheduledTimesArray.schedule[newArrayIndex].fiveBool;

      }
    };
  });
  //--------------------------------------------------
  setTimeout(newTimeArraySorting, setTimeoutTime);
};
newTimeArraySorting();

function newOffsetTime() {
  var offsetTime = offsetTimejson;
  if (typeof offsetTime === "number") {
    offsetTime = offsetTimejson;
  } else {
    offsetTime = 0;
  }
  offsetTime *= 1000 * 60
  return offsetTime
};
newOffsetTime();

function newCurrentTime() {
  var d = new Date();
  var dInMs = d.getTime()
  nowInMs = d.getTime();
  var s = "";
  s += (10 > d.getHours() ? "0" : "") + d.getHours() + ":";
  s += (10 > d.getMinutes() ? "0" : "") + d.getMinutes() + ":";
  s += (10 > d.getSeconds() ? "0" : "") + d.getSeconds();

  return s
};
function newCurrentTimeInMs() {
  var d = new Date();
  var dInMs = d.getTime()

  return dInMs
};
function newStartTimeInMs(time) {
  //console.log(newOffsetTime());
  var d = new Date();
  var dd = new Date(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${time}`);
  var ddInMs = dd.getTime()

  return ddInMs
};
function newStartTime(time) {
  var d = new Date();
  var dd = new Date(`${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()} ${time}`);
  var ddInMs = dd.getTime()

  var s = "";
  s += (10 > dd.getHours() ? "0" : "") + dd.getHours() + ":";
  s += (10 > dd.getMinutes() ? "0" : "") + dd.getMinutes() + ":";
  s += (10 > dd.getSeconds() ? "0" : "") + dd.getSeconds();

  return s

  return ddInMs
};

function newCountDown() {
  var time = "";
  var offsetTime = newOffsetTime();
  var now = newCurrentTimeInMs();
  var startTime = newStartTimeInMs(startTimeTextHolder);
  startTime += offsetTime;

  if (now > startTime) {
    time = now - startTime
    time = (msToTime(time))
  } else {
    time = startTime - now
    time = "-" + (msToTime(time))
  }

  //--------------------------------------------------
  var timeBuffer = 1 * 1000
  var sixMinuteMs = (6 * 1000 * 60);
  var fiveMinuteMs = (5 * 1000 * 60);
  var fourMinuteMs = (4 * 1000 * 60);
  var threeMinuteMs = (3 * 1000 * 60);
  var twoMinuteMs = (2 * 1000 * 60);
  var oneMinuteMs = (1 * 1000 * 60);
  var countDownTimeInMS = startTime - now;
  //console.log((msToTime(startTime - now)));

  //console.log(countDownTimeInMS);
  if (fiveBoolHolder == 1) {
    //  6larm
    if (countDownTimeInMS > sixMinuteMs && countDownTimeInMS < (sixMinuteMs + timeBuffer)) {
      //if (countDownTimeInMS < sixMinuteMs && countDownTimeInMS > fiveMinuteMs) {
    }
    // 5min Alarm
    //if (countDownTimeInMS > fiveMinuteMs && countDownTimeInMS < (fiveMinuteMs + timeBuffer)) {
    if (countDownTimeInMS < fiveMinuteMs && countDownTimeInMS > fourMinuteMs) {
      if (sendMin_To_countDownBoole != 5) {
        sendMin_To_countDownBoole = 5;
        io.emit("sendMin_To_countDown", {
          countDownTime: 5
        });
      };
    }
    // 4min Alarm
    //if (countDownTimeInMS > fourMinuteMs && countDownTimeInMS < (fourMinuteMs + timeBuffer)) {
    if (countDownTimeInMS < fourMinuteMs && countDownTimeInMS > threeMinuteMs) {
      if (sendMin_To_countDownBoole != 4) {
        sendMin_To_countDownBoole = 4;
        io.emit("sendMin_To_countDown", {
          countDownTime: 4
        });
      };
    }
    // 3min Alarm
    //if (countDownTimeInMS > threeMinuteMs && countDownTimeInMS < (threeMinuteMs + timeBuffer)) {
    if (countDownTimeInMS < threeMinuteMs && countDownTimeInMS > twoMinuteMs) {
      if (sendMin_To_countDownBoole != 3) {
        sendMin_To_countDownBoole = 3;
        io.emit("sendMin_To_countDown", {
          countDownTime: 3
        });
      };
    }
    // 2min Alarm
    //if (countDownTimeInMS > twoMinuteMs && countDownTimeInMS < (twoMinuteMs + timeBuffer)) {
    if (countDownTimeInMS < twoMinuteMs && countDownTimeInMS > oneMinuteMs) {
      if (sendMin_To_countDownBoole != 2) {
        sendMin_To_countDownBoole = 2;
        io.emit("sendMin_To_countDown", {
          countDownTime: 2
        });
      };
    }
    // 1min Alarm
    //if (countDownTimeInMS > oneMinuteMs && countDownTimeInMS < (oneMinuteMs + timeBuffer)) {
    if (countDownTimeInMS < oneMinuteMs && countDownTimeInMS > 0) {
      if (sendMin_To_countDownBoole != 1) {
        sendMin_To_countDownBoole = 1;
        io.emit("sendMin_To_countDown", {
          countDownTime: 1
        });
      };
    }
    // 0min Alarm
    //if (countDownTimeInMS > 0 && countDownTimeInMS < (0 + timeBuffer)) {
    if (countDownTimeInMS < 0 || countDownTimeInMS > fiveMinuteMs) {
      if (sendMin_To_countDownBoole != 0) {
        sendMin_To_countDownBoole = 0;
        io.emit("sendMin_To_countDown", {
          countDownTime: 0
        });
      };
    }
  }


  if (fiveBoolHolder == 0) {
    if (sendMin_To_countDownBoole != 0) {
      sendMin_To_countDownBoole = 0;
      io.emit("sendMin_To_countDown", {
        countDownTime: 0
      });
    };
  };
  //--------------------------------------------------




  // io.emit("sendMin_To_countDown", {
  //   countDownTime: now - startTime
  // });


  setTimeout(newCountDown, setTimeoutTime);
  return time
};
newCountDown();

function newCueCountDown() {
  var cueLength = cueLengthTextHolder;
  var cueBool = cueBoolHolder;
  //--------------------------------------------------
  if (cueLength.length > 5) {
    cueLength = timeStringToMs(cueLength);
  } else {
    cueLength = cueLength + ":00"
    cueLength = timeStringToMs(cueLength);
  }
  //--------------------------------------------------
  var offsetTime = newOffsetTime();
  var startTime = newStartTimeInMs(startTimeTextHolder);
  var cueStarTime = (startTime - cueLength)
  cueStarTime += offsetTime
  var now = newCurrentTimeInMs();
  var cueCountDownInMs;

  if (now > cueStarTime) {
    cueCountDownInMs = now - cueStarTime
    time = now - cueStarTime
    time = (msToTime(time))
  } else {
    cueCountDownInMs = cueStarTime - now
    time = cueStarTime - now
    time = "-" + (msToTime(time))
  }
  //--------------------------------------------------
  var textString = "";
  if (now > (cueStarTime - countDown) && now < (cueStarTime + (1000 * 60 * 2)) && cueBoolHolder == 1) {
    textString = "CUE - " + startTitleHolder + ": " + time
  } else {
    textString = ""
  }

  io.emit("getCueTimeString_From_Socket", {
    string: textString,
    newCurrentTimeInMs: cueStarTime - now,
    cueBoolHolder: cueBoolHolder
  });



  setTimeout(newCueCountDown, setTimeoutTime);
};
newCueCountDown();

function timeStringToMs(t) {
  if (t > 5) {
    var r = Number(t.split(':')[0]) * (60 * 60000) + Number(t.split(':')[1]) * (60000) + Number(t.split(':')[2]) * (1000);
  } else {
    t = t + ":00"
    var r = Number(t.split(':')[0]) * (60 * 60000) + Number(t.split(':')[1]) * (60000) + Number(t.split(':')[2]) * (1000);
  }
  return r;

}
function msToTime(s) {
  var ms = s % 1000;
  s = (s - ms) / 1000;
  var secs = s % 60;
  s = (s - secs) / 60;
  var mins = s % 60;
  var hrs = (s - mins) / 60;
  return pad(hrs) + ':' + pad(mins) + ':' + pad(secs);
}
function pad(n, z) {
  z = z || 2;
  return ('00' + n).slice(-z);
}

function sendCenterText() {
  var countDownString = newCountDown();
  var now = newCurrentTimeInMs();
  var offset = newOffsetTime();
  var start = newStartTimeInMs(startTimeTextHolder) + offset;

  // autoResetOffsetTime
  //--------------------------------------------------
  if (now > (start + countUp) && now < (start + countUp + 500)) {
    console.log("autoResetOffsetTime");
    autoResetOffsetTime();
  };
  //--------------------------------------------------

  if (
    now > ((start) - countDown) &&
    now < ((start) + countUp)
  ) {
    var showNowClock = false;
  } else {
    var showNowClock = true;
  }
  //console.log(newStartTimeInMs(startTimeTextHolder)-newCurrentTimeInMs(),);
  io.emit("centerTextContent", {
    countDownString: countDownString,
    countDownTimeInMS: newStartTimeInMs(startTimeTextHolder) - newCurrentTimeInMs(),
    showNowClock: showNowClock,
    newCurrentTime: newCurrentTime(),
    startTitleHolder: startTitleHolder,
    offsetTimeInit: newOffsetTime()
  });
  setTimeout(sendCenterText, setTimeoutTime);
};
sendCenterText();

function autoResetOffsetTime() {
  sleep(1 * 6000).then(() => {
    console.log("autoResetOffsetTime");
    offsetTimeInit = 0;

    if (offsetTimeInit !== undefined) {
      updateOffsetTimeResetjson();
      io.emit("updateOffsetTime_From_Socket", {
        offsetTime: offsetTimeInit
      });
    } else {
      console.log("offsetTimeInit = undefined - autoResetOffsetTime -" + newCurrentTime());
    }

  });



};

function resetsetTimeout() {

  //---------
  sleep(1000 * 60 * 60).then(() => {
    console.log("----------> resetsetTimeout() <----------   " + newCurrentTime());
    fs.writeFile('./autoRestartServer.json', JSON.stringify("adminSettings", null, 4), (err) => {
      if (err) console.log('Error writing file:', err)
    })


    // clearTimeout(newTimeArraySorting);
    // clearTimeout(newCountDown);
    // clearTimeout(newCueCountDown);
    // clearTimeout(sendCenterText);
  });
  //---------
  // newTimeArraySorting();
  // newCountDown();
  // newCueCountDown();
  // sendCenterText();
  //---------


  //setTimeout(resetsetTimeout,(1000*60*5))
};
resetsetTimeout();

function checkIfUserExist(user) {
  console.log("checkIfUserExist + user  = " + user);
  const path = './public/CueLists/' + user + '.json'

  fs.access(path, fs.F_OK, (err) => {
    if (err) {
      fs.writeFile(path, JSON.stringify("adminSettings", null, 4), (err) => {
        if (err) console.log('Error writing file:', err)
      })
      //console.error(err)
      return
    }
    console.log("--------------------> .json file exist from user = " + user);
    jsonReader(path, (err, cueList) => {
      if (err) {
        console.log('Error reading file:', err)
        return
      }
      //-- sort
      cueList.cues.sort(function(a, b) {
        return a.timecode.localeCompare(b.timecode);
      });
      //-- sort
      io.emit("cueListFromSocket", {
        cueList: cueList.cues
      });
    })





  })
};
function addNewCueRowToUser(user) {
  console.log("addNewCueRowToUser + user  = " + user);
  const path = './public/CueLists/' + user + '.json'
  var copyPath = './public/CueLists/AddNewCueRow.json'
  var copyjson = {};
  console.log("copyPath = " + copyPath);

  //----- AddNewCueRow
  jsonReader(copyPath, (err, cueList) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }
    copyjson = cueList;
  })
  //----- UserCueList

  sleep(250).then(() => {
    jsonReader(path, (err, cueList) => {
      if (err) {
        console.log('Error reading file:', err)
        return
      }

      cueList.cues.push(copyjson);
      console.log(cueList.cues);

      //-- sort
      cueList.cues.sort(function(a, b) {
        return a.timecode.localeCompare(b.timecode);
      });
      console.log(cueList.cues);

      sleep(250).then(() => {
        fs.writeFile(path, JSON.stringify(cueList, null, 4), (err) => {
          if (err) console.log('Error writing file:', err)
        })

      })


    })
  });
};
function deleteCueRowFromUser(user,listIndex) {
  console.log("deleteCueRowFromUser + user  = " + user);
  console.log("deleteCueRowFromUser + user  = " + listIndex);
  const path = './public/CueLists/' + user + '.json'

  jsonReader(path, (err, cueList) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }
    console.log(cueList.cues);
    cueList.cues.splice(listIndex, 1);
    console.log(cueList.cues);

    sleep(250).then(() => {
      fs.writeFile(path, JSON.stringify(cueList, null, 4), (err) => {
        if (err) console.log('Error writing file:', err)
      })

    })
  })

};
function deleteRowFromSchedule(listIndex) {
  console.log("deleteRowFromSchedule + user  = " + listIndex);
  const path = './public/admin-settings.json'

  jsonReader(path, (err, adminSettings) => {
    if (err) {
      console.log('Error reading file:', err)
      return
    }
    console.log(adminSettings.schedule);
    adminSettings.schedule.splice(listIndex, 1);
    console.log(adminSettings.schedule);

    sleep(250).then(() => {
      fs.writeFile(path, JSON.stringify(adminSettings, null, 4), (err) => {
        if (err) console.log('Error writing file:', err)
      })

    })
  })

};



function addNewCueRowToUser_FIXME(user) {
  console.log("addNewCueRowToUser + user  = " + user);
  const path = './public/CueLists/' + user + '.json'
  var copyPath = './public/CueLists/AddNewCueRow.json'
  var copyjson = {};
  console.log("copyPath = " + copyPath);

  const a = () => new Promise(resolve => {
    setTimeout(() => resolve('result of a()'), 1000); // 1s delay
  });
  const b = () => new Promise(resolve => {
    setTimeout(() => resolve('result of b()'), 500); // 0.5s delay
  });

  const c = () => new Promise(resolve => {
    setTimeout(() => resolve('result of c()'), 1100); // 1.1s delay
  });
  a()
    .then((result) => {
      console.log('a() success:', result);

      b()
        .then((result) => {
          console.log('b() success:', result);

          c()
            .then((result) => {
              console.log('c() success:', result);
            })
            .catch((error) => {
              console.log('c() error:', error);
            });

        })
        .catch((error) => {
          console.log('b() error:', error);
        });
    })
    .catch((error) => {
      console.log('a() error:', error);
    });

};
//----- Promise


module.exports = socketio;
