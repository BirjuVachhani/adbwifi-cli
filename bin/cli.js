#!/usr/bin/env node

var os = require('os');
let exec = require('child_process').exec;
const chalk = require("chalk");
const boxen = require("boxen");
let inquirer= require("inquirer");
const port = 5057;

function executeAdb(command) {
    //
    return new Promise((ress, rej) => {
      exec(command, (error, res, err) => {
        let data = {
          err,
          res,
          error
        }
        ress(data)
      })
    })
}

// This funtion retrieves all the available adb devices by executing command: `adb devices`
async function getAvailableDevices(){
  var devices  = (await executeAdb("adb devices"))
  .res // get result
  .split("\n") // divide into lines
  .filter((item)=> item.includes("\t")) // filter out extra rows and text
  .map((item)=>{ // returns device list
      var parts = item.split("\t"); // divide into device id and device name
      var map = {"id" : parts[0], "name" : parts[1]} // create json of device id and name
      return map
  });
  return devices;
}

// Returns an object to printed which is customized text
function printDevices(devices){

  const greeting = chalk.white.bold("List of Available Devices");

  const boxenOptions = {
    padding: {
      "right":4,
      "left":4
    },
   borderStyle: "double",
   borderColor: "green",
  };
  const msgBox = boxen( greeting, boxenOptions );

  console.log(msgBox);
  console.log(chalk.red("Index\t\tDevice ID"));
  devices.forEach( (element, index) => {
      console.log("".concat(index+1,"\t\t",element.id));
  });
}

async function getInput(text){
  const questions = [];
   questions.push({
     type: 'input',
     name: 'selected',
     message: text
   });
  return await inquirer.prompt(questions);
}

function parseIP(str) {
  let start = str.lastIndexOf('inet addr') + 10
  let end = str.indexOf(' ', start)
  let ipaddress = str.substr(start, end - start)
  return ipaddress
}

// opens tcp port on the given device
async function openTcpPort(device){
  var command = `adb -s ${device.id} tcpip ${port}`
  const res = await executeAdb(command)
}

// Retrieves Device IP address
async function getDeviceIP(device){
  // TODO: retrive device ID
  var command = `adb -s ${device.id} shell ifconfig wlan0`
  var resp = await executeAdb(command);
  return parseIP(resp.res);
}

async function connectDevice(id, ip, port){
  var command = `adb -s ${id} connect ${ip}:${port}`;
  return await executeAdb(command);
}

async function cli() {
  // get devices list
  var devices = await getAvailableDevices();

  // print devices list
  printDevices(devices);

  // take user input for device selection
  var response = await getInput("\nPlease Enter the device index to connect: ");
  var selectedIndex = parseInt(response.selected)-1;
  var selectedDevice = devices[selectedIndex];

  // get deviceIP
  var deviceIP = await getDeviceIP(selectedDevice);

  // open tcp port on selected device by running adb command
  await openTcpPort(selectedDevice);

  // connect device wirelessly
  var response = await connectDevice(selectedDevice.id,deviceIP,port);
  if(response.err == ""){
    console.log("Successfully connected....Enjoy👍");
    // var connectedDevices = await getAvailableDevices();
    // printDevices(connectedDevices);
  } else {
    console.log("Unable to connect: ",response.err);
  }
}

// starts process
cli();

