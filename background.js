importScripts("control.js")
showUs()
let userId
let taskId
let state
let autos


chrome.runtime.onMessage.addListener(async(request, sender, sendResponse)=>{
    if(request.state){
        state=request.state
        chrome.storage.local.set({state:state}).then(async()=>{
            console.log(state);
            if(request.state=='ON'){
                // initialSet()
                // initiateExtension(false)
            }
        })  
    }
    if(request.autos){
        autos=request.autos

        chrome.storage.local.set({autos:autos}).then(async()=>{
            if(request.autos=='ON'){
                resetAutos()
            }
        }) 
    }
    if(request.setId){
        userId=request.setId
        console.log('user Id set to',userId);
        chrome.storage.local.set({userId:userId}).then(async()=>{
            // initialSet()
            console.log('User id reset');
            initiateExtension(false)
        })  
    }

    if(request.setTask){
        taskId=request.setTask
        chrome.storage.local.set({taskId:taskId}).then(async()=>{
            console.log('User id reset');
            console.log(`task:`,taskId);
        })  
    }

    if(request.progress){
        if(typeof request.progress=='number'){
            updateProgress(request.objectId,null,request.progress)
        }
        else{
            updateProgress(request.objectId,null,'finished')
        }
    }
    if(request.finalize){
        try {
            let obId=request.finalize
        let toWin=winObs.filter(item=>item.objectId==obId)[0]
        windId=toWin.window
        winObs=winObs.filter(item=>item.objectId!=obId)
        let trial=0
        let done=false
        while(!done){
            chrome.windows.getAll(winds=>{
                winds.forEach(wind=>{
                    if(wind.id==windId){
                        done=true
                        chrome.windows.remove(wind.id)
                    }
                })
            })
            await sleep(1500)
            trial+=1
        }
            
        } catch (error) {
            
        }
        
        
    }
    

    if(request.update){
        sendResponse('Received update')
        console.log(`${request.update} tab: ${sender.tab.id}`)
        if(request.remove){
            if(request.remove==='0'){
                console.log('Preserving tab');
                readPending(sender.tab.id,true)
            }
            else{
                console.log('Removing tab');
                readPending(sender.tab.id,false)
            }
        }
        if(request.remaining){
            chrome.tabs.update(sender.tab.id,{
                url:request.target
            },async(tab)=>{
                console.log('loading...');
                let sent=false
                chrome.tabs.onUpdated.addListener(function (tabIdty , info) {
                            
                    if (info.status == 'complete') {
                        
                      if(tab.id==tabIdty){
            
                        if(!sent){
                            console.log('Sending the rest to',tab.id);
                            sent=true
                            executeMe(tabIdty,request.remaining,request.objectId)
                        }
                        
                      }
                    }
                  });
            })

        }

    }

    if(request.runOne){
        let acts=await getActions()
        let action_to_run=acts.filter(item=>item.objectId==request.runOne)[0]
        console.log('Directed to run : ',action_to_run);
        // interactOne(action_to_run)
        showAction(action_to_run)
    }

    if(request.updateSchedule){
        console.log('Received shedule update request',request);
        let id=request.updateSchedule
        let action=request.updateTo
        updateSchedule(id,action)
    }

    if(request.makeOne){
        let {period,every,actionId,initStatus,sched_name}=request
        // console.log('To make',period,every,actionId,initStatus,sched_name);
       
        makeSchedule(period,every,actionId,initStatus,sched_name)
    }
})



const resetAutos=()=>{
    chrome.alarms.create(`startAutos`,{
        delayInMinutes:5,
        periodInMinutes:5
    }) 
}

const checkUs=()=>{
   
    chrome.storage.local.get(["userId"]).then(async(result) => {
        if(result.userId){
            userId=result.userId
            let rules=await getRules()
            if(rules instanceof Array ){
                console.log(('Rules:',rules));
                rules=await formartRules(rules)
                if(rules.length==0){
                    console.log('No enabled rules for',userId);
                }
                else{
                    let listeners=await addRuleListeners(rules)
                    console.log(listeners);
                }
                
                let schedules=await getSchedules()
                if(schedules instanceof Array){
                    setSchedulesAlarm(schedules)
                }
                else{
                    console.log(schedules);
                }
                
            }
            else{
                console.log(rules);
            }
        }
        else{
            console.log('No user ID');
        }
      });
}
const initiateExtension=(whole)=>{
    console.log('Initiating extensension');
    chrome.storage.local.get(["state"]).then((result) => {
        if(result.state){
            state=result.state
            if(state=='OFF'){
                console.log('0FF');
            }
            else{
                console.log(state);
            }
            checkUs()
        }
        else{
            state='ON'
            chrome.storage.local.set({state:'ON'}).then(async()=>{
                console.log(state);
                if(whole){
                    checkUs()
                }
                
            })  
        }
      });
    console.log('Finished Init');
}

initiateExtension(true)

const makeSchedule=async(period,every,actionId,initStatus,sched_name)=>{

    let createObj={
        "name":sched_name,
        "enabled":initStatus=='false'?false:true,
        "every":every,
        "period":parseInt(period),
        "action":actionId,
        "userID":userId

    }
    


    let res=await fetch('https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules',{
        method:'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(createObj)
    })

    if(res.status==200){
        let response =await res.json()
        console.log('Successfully created new schedule',response);
    }
    else{
        console.log('Failed to create schedule');
    }

    let schedules=await getSchedules()

    if(schedules instanceof Array){
        setSchedulesAlarm(schedules)
    }
    else{
        console.log(schedules);
    }

}

const updateSchedule=async(id,type)=>{
    let trial=0
    let found=false
    let res

    while(trial<20 && !found){
        try{
            if(type=='play' || type=='pause'){
                let bd={
                    objectId:id,
                    enabled:type=='play'?true:false
                }
                console.log(`Updating action`);
                res=fetch('https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules',{
                method:'PUT',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(bd)
            })
            found=true
            }
            else if(type=='delete'){
                console.log('Received delete request');
                res=fetch('https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules',{
                    method:'DELETE',
                    body:JSON.stringify({objectId:id})
                })
                found=true
            }  
            
        }
        catch{
            trial+=1
        }
    }

    if(!found){
        console.log();(`Update failed.Please check connection`);

    }
    else{
        
        if(type=='play' || type=='pause'){
            console.log('Action updated...');
        }
        else{
            console.log('Action deleted');
        }
        
    }

    let schedules=await getSchedules()

    if(schedules instanceof Array){
        setSchedulesAlarm(schedules)
    }
    else{
        console.log(schedules);
    }
}

chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener(async(message,port)=>{
        if(message.checkValues){
            absent=[]
            if(!state){
                absent.push('state')
            }
            if(!userId){
                absent.push('userId')
            }
            if(!taskId){
                absent.push('taskId')
            }
            if(!autos){
                absent.push('autos')
            }
            if(port){
                port.postMessage({absent:absent},()=>{
                    if (chrome.runtime.lastError) {}
                })
            }
            
        }

        if(message.fetchSchedules){
            let schedules=await getSchedules()
            if(port){
                try{
                    port.postMessage({schedules:schedules},()=>{
                        if (chrome.runtime.lastError) {}
                    })
                }
                catch(err){
                    console.log('PORT CLOSED');
                }
                
            }
           
            
        }
        if(message.fetchActions){
            let act_actions=await getActions()
            if(port){
                try{
                    port.postMessage({act_actions:act_actions},()=>{
                        if (chrome.runtime.lastError) {}
                    })
                }
                catch(err){
                    console.log('PORT CLOSED');
                }
                
            }
            
        }

        if(message.fetchOne){
            let schedules=await getSchedules()
            let theOne=schedules.filter(item=>item.objectId==message.fetchId)[0]
            if(port){
                try{
                    port.postMessage({schedule:theOne},()=>{
                        if (chrome.runtime.lastError) {}
                    })
                }
                catch(err){
                    console.log('PORT CLOSED');
                }
                
                
            }
            
        }
        if(message.fetchAutos){
            let autos=await getAutoActions()
            if(port){
                port.postMessage({auto_actions:autos},()=>{
                    if (chrome.runtime.lastError) {}
                })
            }
            
        }
        if(message.pauseThis){
            // addToPause(message.pauseThis)
            if(pausedActs.includes(message.pauseThis)){
                console.log('Action already paused');
            }
            else{
                pausedActs.push(message.pauseThis)
                console.log('PAUSING ACTION');
                console.log(pausedActs);
            }
            
        }
        if(message.playThis){
            // removePause(message.playThis)
            if(pausedActs.includes(message.playThis)){
                pausedActs.splice(pausedActs.indexOf(message.playThis),1)
                console.log('PLAYING ACTION');
                console.log(pausedActs);
            }
        }
    })        

})

// let freeport = chrome.runtime.connect({
//     name: "freePort"
// });


const checkPause=async(id)=>{
    return new Promise(async(resolve,reject)=>{
        if(pausedActs.includes(id)){
           await sleep(500)
           let tt=await checkPause(id)
        }
        else{
            resolve(id)
        }
    })
}


const initialSet=async()=>{
    let ext_status=await checkState()
    let ext_userId=await checkUser()
    let rules=await getRules()
    if(rules instanceof Array ){
        let listeners=await addRuleListeners(rules)
        console.log(listeners);
        let schedules=await getSchedules()
        if(schedules instanceof Array){
            setSchedulesAlarm(schedules)
        }
        else{
            console.log(schedules);
        }
        
    }
    else{
        console.log(rules);
    }
    
}

const getActions=()=>{
    return new Promise(async(resolve,reject)=>{
        if(userId){
            let actionsUri=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/action?userID='${userId}'`

            let trial=0
            let found=false
            let res

            while(trial<20 && !found){
                try{
                    console.log(`Fetching ${userId} actions`);
                    res=await fetch(actionsUri,{
                        method:'GET',
                        headers:{
                            'Content-Type':'application/json'
                        }
                    })
                    found=true
                }
                catch{
                    trial+=1
                }
            }

            if(!found){
                resolve('Please check network');

            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    result=result.filter(item=>item.userID==userId)
                    console.log(result);
                    // let toRun=result.filter(item=>item.objectId==id)
                    resolve(result) 
                }else{
                    resolve(`Error fetching actions for ${userId}`) 
                    console.log(res);
                }
    
            }

        }
        resolve('No user Id')
    })
}

let pending=[]
let window_Id

const readPending=(tab,preserve)=>{
    if(pending.length!=0){
        let schedule_id=pending[0].schedule_id
        let schedule_name=pending[0].schedule_name
        pending.shift()
        console.log(`Running ${schedule_name}`);
        oneRunning=schedule_id
        runSingle(oneRunning)

    }else{
        oneRunning=false
    }
    if(!preserve){
        chrome.tabs.remove(tab)
    }
    else{
        chrome.alarms.create(`${tab}`,{
            delayInMinutes:60,
        })
    }
}



const setSchedulesAlarm=async(schedules)=>{
    chrome.alarms.clearAll()

    chrome.alarms.create(`startAutos`,{
        delayInMinutes:5,
        periodInMinutes:5
    })
    
    let allSchedIds=[]
    schedules.forEach(item=>{
        allSchedIds.push(item.objectId)
    })
    let alreadySet=[]
    let newScheds=[]

    const setThemAll=async(schedules)=>{
        return new Promise(async(resolve,reject)=>{
            schedules.forEach(obj=>{
                let minutes
                let wak
                let period=obj.period?obj.period:1
                if(obj.every=='day' || obj.every=='days'){
                    minutes=1440*period
                }
                else if(obj.every=='week' || obj.every=='weeks'){
                    // minutes=10080
                    minutes=10080*period
                }
                else if(obj.every=='hour' || obj.every=='hours'){
                    // minutes=60
                    minutes=60*period
                }
                else if(obj.every=='minute' || obj.every=='minutes'){
                    minutes=1*period
                }
                
                chrome.alarms.create(`${obj.name}~${obj.action}~${obj.objectId}`,{
                    delayInMinutes:minutes,
                    periodInMinutes:minutes
                })
                let date=new Date()
                let hours=date.getHours()
                let mins=date.getMinutes()
                mins=mins<10?`0${mins}`:mins
        
                let curr_time=`${hours}:${mins}`
                if(obj.period==1){
                    console.log(`Set "${obj.name}" for every ${obj.every} from now - ${curr_time}`);
                }else{
                    console.log(`Set "${obj.name}" for every ${obj.period} ${obj.every}s  from now -${curr_time}`);
                }
                
            })

            const allAlarms=await chrome.alarms.getAll()

            console.log('All schedules set');
            console.log(allAlarms);
            resolve(schedules)

            

        })
        
    }

    setThemAll(schedules)

    // return new Promise((resolve,reject)=>{
    //     let ans=[]
    //     // chrome.alarms.clearAll()
    //     console.log(allSchedIds);
    //     resolve('done')

    //     let alreadyHere=[]
    //     let allSchedIds2=[...allSchedIds]


    //     chrome.alarms.getAll(async(allAlarms)=>{
    //         if(allAlarms.length==0){
    //             console.log('No set alarms. Adding all');
    //             setThemAll(schedules)
    //         }else{
    //             console.log(allAlarms);
    //             allAlarms.forEach(Alarm=>{
    //                 let id=Alarm.name.split('~')[2]
    //                 if(allSchedIds.includes(id)){
    //                     allSchedIds2.splice(allSchedIds2.indexOf(id),1)
    //                     let sched_name=schedules.filter(sched=>sched.objectId==id)[0].name
    //                     console.log(`${sched_name} already added`);
    //                 }
    //                 else{
    //                     console.log('1 previously set alarm still here. Removing')
    //                     chrome.alarms.clear(Alarm.name)
    //                 }
    //             })
    //             if(allSchedIds2.length==0){
    //                 console.log('No new schedules set');
    //             }
    //             else{
    //                 console.log(`Setting ${allSchedIds2.length} new schedules`);
    //                 let toSet=schedules.filter(sched=>allSchedIds2.includes(sched.objectId))
    //                 // console.log(schedules);
    //                 // console.log(allSchedIds2);
    //                 console.log(toSet);
    //                 ans=await setThemAll(toSet)
    //                 resolve(ans)
    //             }
    //         }
    //     })

        // chrome.alarms.getAll(async(allAllarms)=>{
        //     if (allAllarms && allAllarms.length!=0){
        //         console.log('These are the av. alarms',allAllarms);
        //         // allAllarms.forEach(alm=>{
        //         //     let id=alm.name.split('~')[2]
        //         //     alreadySet.push(id)
        //         // })
        //         // console.log('Already set',alreadySet);
        //         // newScheds=schedules.filter(item=>!alreadySet.includes(item.objectId))
        //         // if(newScheds.length==0){
        //         //     console.log('No new schedules set');
        //         // }
        //         // else{
        //         //     console.log('Setting these only',newScheds);
        //         //     ans=setThemAll(newScheds)

        //         // }
    
        //     }
        //     else{
        //         console.log('No alarms set, setting all');
        //         // ans=setThemAll(schedules)
        //     }
        //     resolve(ans)
        // })
    // })
    
    
}
const runningWindows=[]

const completeAction=(windId)=>{
    console.log('Action COMPLETED');
    if(windId){
        let act=runningWindows.filter(item=>item.window==windId)[0].action_id
    }

}
const makeWindow=(url,action_id)=>{
    
    return new Promise(async(resolve,reject)=>{

        chrome.windows.create({
            focused:false,
            type:'normal',
            height:900,
            width:1600,
            left:60,
            top:200,
            // state:'maximized',
            url:url
        },(window)=>{
            // window_Id=window.id
            runningWindows.push({
                window:window.id,
                action_id
            })
            chrome.windows.onRemoved.addListener(
                (windId)=>{
                    if(windId==window){
                        window=false
                    }
                    completeAction(windId)
                }
              )
            
            // chrome.windows.update(window_Id,{state:"fullscreen"})
            console.log('making new window');
            resolve(window.tabs[0].id)

        })

        // if(window_Id){
        //     console.log('Window available');
        //     chrome.tabs.create({
        //         url:url,
        //         windowId:window_Id,
        //         active:false
        //     },(tab)=>{
        //         console.log(tab);
        //         console.log('Adding to old window',tab.id);
        //         resolve(tab.id)
        //     })
            
        // }else{
        //     console.log('No Window available');
        //     chrome.windows.create({
        //         focused:false,
        //         type:'normal',
                
        //         height:900,
        //         width:1600,
        //         // left:60,
        //         // top:200,
        //         // state:'maximized',
        //         url:url
        //     },(window)=>{
        //         window_Id=window.id
        //         chrome.windows.onRemoved.addListener(
        //             (windId)=>{
        //                 if(windId==window){
        //                     window=false
        //                 }
        //             }
        //           )
                
        //         // chrome.windows.update(window_Id,{state:"fullscreen"})
        //         console.log('making new window');
        //         resolve(window.tabs[0].id)

        //     })  
        // }
    })
}

let oneRunning=false

const getAutoActions=()=>{
    return new Promise(async(resolve,reject)=>{
        if(userId){
            let auto_actionsUri=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/auto?pageSize=10&where=userID%3D'${userId}'%20AND%20complete%20%3D%20false&sortBy=%60created%60%20desc`
            let trial=0
            let found=false
            let res

            while(trial<20 && !found){
                try{
                    console.log(`Fetching ${userId} auto actions`);
                    res=await fetch(auto_actionsUri,{
                        method:'GET',
                        headers:{
                            'Content-Type':'application/json'
                        }
                    })
                    found=true
                }
                catch{
                    trial+=1
                }
            }

            if(!found){
                resolve('Please check network');

            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    // result=result.filter(item=>item.userID==userId)
                    console.log('auto actions',result);
                    // let toRun=result.filter(item=>item.objectId==id)
                    resolve(result) 
                }else{
                    resolve(`Error fetching auto actions for ${userId}`) 
                    console.log(res);
                }
    
            }

        }
        resolve('No user Id')
    })

}

const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const postPer=async(runTab,obj,runWin,objectId)=>{
    // console.log('controlling in tab: ',runTab);
    return new Promise(async(resolve,reject)=>{
        let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
        // console.log(port);

        if(pp=='missing'){
            resolve('missing')
        }
        // chrome.windows.getAll(wins=>{
        //     wins.forEach(window=>{
        //         if(window.id==runWin){
        //             runTab=window.tabs[0].id
        //             console.log('Attempting to connect to',runTab);
        //         }
        //     })
        // })
        // port=await chrome.tabs.sendMessage(runTab,{startConn:'connect_to_me'})
        
        
        chrome.runtime.onConnect.addListener(port=>{
            if(port.name=='ctrl_port'){
                // console.log(port);
                port.postMessage(obj,()=>{
                    if (chrome.runtime.lastError) {}
                }) 
                port.onMessage.addListener((msg)=>{
                    if(msg.feedback){
                        resolve(msg.feedback)
                    }
                })
            }
            
            
        })
        let port=await chrome.tabs.sendMessage(runTab,{startConn:'connect_to_me'},()=>{
            if (chrome.runtime.lastError) {}
        })
        
        

        // try {
              
        // } catch (error) {
        //     resolve("missing")
            
        // }

    })
}

const navPort=(tabz,url)=>{
    return new Promise((resolve,reject)=>{
        chrome.tabs.update(tabz,{url:url},async(tab)=>{
            console.log('navigating...');
            let sent=false
            chrome.tabs.onUpdated.addListener(function (tabIdty , info) {
                        
                if (info.status == 'complete') {
                    
                  if(tabz==tabIdty){
        
                    resolve('Finished loading')
                    // chrome.tabs.sendMessage(runTab,{startConn:'connect_to_me'})
                    // chrome.runtime.onConnect.addListener(async(port)=>{
                    //     if(port.sender.tab.id==tabz){
                    //         resolve(port)
                    //     }
                    // })
                    
                  }
                }
              });
        })
    })
}



let winObs=[]

const checkWindows=(winID)=>{
    return new Promise((resolve,reject)=>{
        let present
        const check=async(winID)=>{
            await sleep(1500)
            chrome.windows.getAll(windows=>{
                windows.forEach(win=>{
                    if(win.id==winID){
                        present=true
                    }
                })
                if(!present){
                    resolve('missing')
                }
                else{
                    present=false
                    check(winID)
                }
            })
        }

        check(winID)
    })
}



const finishProgress=async(id)=>{
   
    // port.postMessage({completeProgress:id})
    // freePort.postMessage({completeProgress:id},()=>{
    //     if (chrome.runtime.lastError) {}
    // })
    let action_ids=await chrome.storage.local.get('action_ids')
    let actions=action_ids.action_ids

    if(actions && actions.length>0){
    console.log('Finishing PROGRESS');


    let ind=actions.indexOf(id)
    actions.splice(ind,1)
    console.log('Setting acts',actions);
    chrome.storage.local.set({action_ids:actions})

    let running=await chrome.storage.local.get('running_actions')
    let running_actions=running.running_actions
    if(running_actions && running_actions.length>0 ){

    console.log('ERRA',running_actions);

    let prop=running_actions.filter(item=>{
        if(item && item.act_id==id){
            return item
        }
        
    })[0]
    let rem=running_actions.filter(item=>{
        if(item && item.act_id!=id){
            return item
        }
    })
    running_actions=rem

    console.log('Setting running',running_actions);

    chrome.storage.local.set({running_actions:running_actions})

    let  scheds=await chrome.storage.local.get('sched_ids')
    let schedules=scheds.sched_ids
    
    if(prop.sched){
        let sc_id=prop.sched
        let ind2=schedules.indexOf(sc_id)
        schedules.splice(ind2,1)

        chrome.storage.local.set({sched_ids:schedules})


    }
}
}


}

const makeShoWin=(url,objectId)=>{
    return new Promise((resolve,reject)=>{
        chrome.windows.create({
            focused:false,
            type:'normal',
            height:900,
            width:1600,
            // height:500,
            // width:800,
            // top:50,
            // left:100,
            
            url:url
        },(window)=>{
            chrome.windows.onRemoved.addListener(
                (windId)=>{
                    if(windId==window){
                        // completeShow(objectId)
                        finishProgress(objectId)
                    }
                }
              )
            
            console.log('making new window');
            winObs.push({objectId,window:window.id})
            resolve([window.tabs[0].id,window.id])

        })
    })
}

const updateAuto=async(id)=>{
    let ob={
        objectId:id,
        completed:true
    }

    let updateUrl=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/auto?pageSize=10&where=userID%3D'${userId}'%20AND%20complete%20%3D%20false&sortBy=%60created%60%20desc`

    let trial=0
    let found=false
    let res

    while(trial<20 && !found){
        try{
            console.log(`Updating auto action`);
            res=await fetch(updateUrl,{
                method:'PUT',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(ob)
            })
            found=true
        }
        catch{
            trial+=1
        }
    }

    if(!found){
        console.log('Please check network');

    }
    else{
        if(res.status==200){
            let result=await res.json()
            console.log('auto action updated successfully') 
        }else{
            console.log(`Error updating auto action`) 
        }

    }
    
}

const initiateAutos=async()=>{
    let auto_acts=await getAutoActions()
    // let auto_acts=await getActions()
    if(auto_acts instanceof Array){
        for(let i=0;i<auto_acts.length;i++){
            let fin=await showAction(auto_acts[i])
            await sleep(10000)
            updateAuto(auto_acts[i].objectId)
        }
        
    }
    else{
        console.log(auto_acts);
    }
}



chrome.alarms.onAlarm.addListener(async(Alarm)=>{
    let date=new Date()
    let hours=date.getHours()
    let mins=date.getMinutes()

    if(Alarm.name.includes('~')){
        mins=mins<10?`0${mins}`:mins

        let curr_time=`${hours}:${mins}`
        console.log(`Time!${curr_time}`);

        if(state=='OFF'){
            console.log('OFF');
        }
        else{
            let schedId=Alarm.name.split('~')[2]
            let schedulez=await getSchedules()


            let rel={enabled:true}
            if(schedulez instanceof Array){
                rel=schedulez.filter(item=>item.objectId==schedId)[0]
            }

            console.log('To run',rel);


            if(rel.enabled==true){
                console.log('Schedule enabled .Running...',rel);
                let schedule_id=Alarm.name.split('~')[1]
                let schedule_name=Alarm.name.split('~')[0]
                console.log(Alarm.name);
                console.log(`Running "${schedule_name}"`);


                if(oneRunning){
                    console.log('Another action running.Pushing to pending');
                    // pending.push({schedule_id:schedule_id,schedule_name:schedule_name})
                }
                else{
                    console.log('None Running');
                    // oneRunning=schedule_id
                    updateLastRun(rel)
                    runSingle(schedule_id,rel.objectId)   
                } 
            }
            else if(rel.enabled==false){
                console.log('Schedule is disabled');
            }
            else{
                console.log('None of those');
            }
        
            
            
        }

    }
    else if(Alarm.name=='startAutos'){
        console.log('AUTO MODE TIME');
        if(autos=='ON'){
            initiateAutos()
        }
    }
    else{

        let schedules=await getSchedules()

        if(schedules instanceof Array){
            setSchedulesAlarm(schedules)
        }
        else{
            console.log(schedules);
        }

        chrome.tabs.query({
            windowType:'normal'
        },(tabs)=>{
            tabs.forEach(tab=>{
                if(tab.id==parseInt(Alarm.name)){
                    console.log('Time!!: Closing window');
                    chrome.tabs.remove(tab.id)
                }
            })
        })
        
    }
    
})

const updateLastRun=async(sched_obj)=>{
    const theTime = new Date().getTime()

    let upDateObj={
        objectId:sched_obj.objectId,
        lastrun:theTime
    }

    let updateUrl=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules?where=userID%3D'${userId}'`
            let trial=0
            let found=false
            let res

            while(trial<20 && !found){
                try{
                    console.log(`Updating schedule`);
                    res=await fetch(updateUrl,{
                        method:'PUT',
                        headers:{
                            'Content-Type':'application/json'
                        },
                        body:JSON.stringify(upDateObj)
                    })
                    found=true
                }
                catch{
                    trial+=1
                }
            }

            if(!found){
                console.log('Please check network');

            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    console.log('schedule updated successfully') 
                }else{
                    console.log(`Error updating schedule`) 
                }
    
            }



}

const runSingle=async(id,sched)=>{
    let actions=await getActions()

    if(actions instanceof Array){
        
        let toRun=actions.filter(item=>item.objectId==id)[0]
        console.log('Running',toRun);
        // console.log('Specific to be run',toRun);
        // interactOne(toRun)
        showAction(toRun,sched)
    }
    else{
        console.log(actions);
    }
}



const interactOne=async(obj)=>{
    let tabId

    // startProgress(obj.objectId)
    
    tabId=await makeWindow(obj.target_page,obj.objectId)
    
    if(typeof tabId=='string'){
        console.log('OFF');
    }
    else{

        const checkCompletion=()=>{
            return new Promise(async(resolve,reject)=>{
                chrome.tabs.onUpdated.addListener(async function async(tabIdt , info,tab) {
                
                if (info.status === 'complete') {
                
                if(tabIdt==tabId){
                    console.log('Tab done loading');
                    let remove=true

                    if(typeof(obj.remove)=='undefined' || obj.remove==null ){
                        remove=true

                    }else{
                        remove=obj.remove 
                    }

                    console.log('Remove value set to',remove);
                    let statusss=await connectRun(tabId,obj,remove)
                    resolve(statusss)
                }
                }
            });
            })
        }


        let comp=await checkCompletion()
    }
}

const updateProg=async(id)=>{
    let running=await chrome.storage.local.get('running_actions')
    let running_acts=running.running_actions

    if(running_acts){
        let relOb=running_acts.filter(ob=>ob.act_id==id)[0]
    let remOb=running_acts.filter(ob=>ob.act_id!=id)


    if(relOb){
        if(relOb.pos){
            relOb.pos=relOb.pos+1
        }
        else{
            relOb.pos=1
        }
        
    }



    running_acts=[]
    running_acts.push(relOb)
    running_acts.concat(remOb)

    chrome.storage.local.set({running_actions:running_acts})

    }
    

}

const pausedActs=[]





const connectRun=async(tabid,obj,remove)=>{
    console.log('Running',obj);
    
    return new Promise(async(resolve,reject)=>{
        let arr=obj.actions
        let arranged_arr=[]
        for(let a=0;a<arr.length;a++){
            let nav=false
            for(let m=0;m<arr[a].flow.length;m++){
                if(arr[a].flow[m].event && arr[a].flow[m].event=='navigate'){
                    nav=true
                }
            }
            if(!nav){
                arranged_arr.push(arr[a])

            }else{
                let oBB=arr[a]
                let nav_event=oBB.flow.filter(item=>item.event=='navigate')[0]
                let nav_rest=oBB.flow.filter(item=>item.event!=='navigate')
                

                arranged_arr.push(nav_event)
                oBB.flow=nav_rest
                arranged_arr.push(oBB)

            }
        }

        arranged_arr.push({remove:remove,objectId:obj.objectId})


        console.log(arranged_arr);
        // initProgress(obj.objectId,arranged_arr,true)
        let total=0
        arranged_arr.forEach(ob=>{
            
            if(ob.flow){
                
                if(ob.repeat){
                
                    total+=ob.flow.length*ob.repeat
                }
                else{

                    total+=ob.flow.length
                }
                
            }
            else if(ob.remove){
                console.log('Adding 1');
                total+=1
            }
            else if(ob.event){
                console.log('Adding 1');
                total+=1
            }
           
        })
        updateProgress(obj.objectId,total,null)
        executeMe(tabid,arranged_arr,obj.objectId)
        })
    
    
}

const executeMe=(tabId,arr,objectId)=>{
    chrome.tabs.sendMessage(tabId, {
        
        beginRun:true,
        acts:arr,
        objectId
    },()=>{
        if (chrome.runtime.lastError) {}
    }); 
}

let req_ids=[]

const addRuleListeners=(rule_arr)=>{

    return new Promise((resolve,reject)=>{
        req_ids=[]

        rule_arr.forEach(rule=>{
            chrome.webRequest.onBeforeSendHeaders.addListener((n)=>{
                if(state=='OFF'){
    
                }else{
                    if(n.initiator.includes('chrome-extension')){
                        
                    }
                    else{
                        reqHeaders=n.requestHeaders
                        let pageRelevant=false
                        
                        let referer = n.requestHeaders.find(u => u.name.toLowerCase() === "referer").value
                    
                        if(referer.includes(rule.page_first)){
                            pageRelevant=true
    
                                if(rule.page_rest.length!=0){
                                    rule.page_rest.forEach(val=>{
                                        if(!referer.includes(val)){
                                            pageRelevant=false
                                            return true
                                        }
                                    })
                                }
                                let urlRelevant=true
    
                                if(pageRelevant){
                                    if(rule.url_rest.length!=0){
                                        rule.url_rest.forEach(vali=>{
                                            if(!n.url.includes(vali)){
                                                urlRelevant=false
                                            }
                                        })
                                    }
                                }else{
                                    
                                }
                                if(urlRelevant){
                                    
                                    if(n.method.toUpperCase()=='POST'){
                                        // handlePosts(rule,n)
                                    }
                                    else{
    
                                        duplicateRequest(n.url,reqHeaders,n.method,rule.destination,rule.label,n.requestId,referer)
                                    } 
    
                                }
                
                                }
                        
                            
                        }
                    }
                    
                },{urls:[`${rule.url_first}*`]},["requestHeaders","extraHeaders"])
    
                //Handling POST REQUESTS
                chrome.webRequest.onBeforeRequest.addListener(m=>{
                    if(state=='OFF'){
    
                    }else{
                        if(m.initiator.includes('chrome-extension')){
                            
                        }
                        else{
                            let postPageRelevant=true
    
                               
                            let urlRelevant=true
    
                            if(postPageRelevant){
                                if(rule.url_rest.length!=0){
                                    rule.url_rest.forEach(vali=>{
                                        if(!m.url.includes(vali)){
                                            urlRelevant=false
                                        }
                                    })
                                }
                            }
                            if(urlRelevant){
                                
                                if(m.method.toUpperCase()=='POST' && rule.methods.includes("POST")){
                                    // handlePosts(rule,n)
                                    duplicatePostRequest(m.url,reqHeaders,m.method,rule.destination,rule.label,m.requestId,m.requestBody,rule.page_first)
    
                                }
                                else{
    
                                } 
                                
    
                            }
                            else{
    
                            }
                        
                            
                        }
                    }
                },{urls:[`${rule.url_first}*`]},["requestBody","extraHeaders"])
            })
            resolve("Rule listeners added")
    })

    
}

const duplicateRequest=(url,headers,method,destination,label,reqId,origin_page)=>{
    if(req_ids.includes(reqId)){
        console.log('Duplicate: already handled');
    }
    else{
        req_ids.push(reqId)
        console.log('Found valid (GET)',url)
        let heads={}
        headers.forEach(val=>{
            heads[val.name]=val.value
        })

         fetch(url,{
        method:method,
        headers:heads
        })
        .then(async res=>{
            if(res.status==200){
                let resBody=await res.json()
                sendResBody(resBody,url,destination,label,'GET',origin_page)

            }else{
                console.log(`Error duplicating (GET) ${url} `);
            }

        })


    }
   
}


const duplicatePostRequest=async(url,headers,method,destination,label,reqId,body,page)=>{
    if(req_ids.includes(reqId)){
        console.log('Duplicate : already handled');
    }
    else{
        req_ids.push(reqId)
        console.log("Found valid (POST)",url)

    }

}

const sendResBody=(result,url,destination,label,method,origin_page)=>{

    let data={}
    for (const [key, value] of Object.entries(result)) {
        data[key]=value
      }
    console.log(`Successfully duplicated (${method}) ${url} sending...`)
    fetch(destination+'?'+new URLSearchParams({
        user:userId,
        task:taskId,
        label:label,
        target_page:origin_page,
        target_url:url
    }),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(data)
        // body:JSON.stringify({name:'Austo'})
    })
    .then(res=>{
        if(res.status==200){
            console.log(`Successfully sent (${method}) response body to ${destination}`);
        }
        else{
            console.log('Error sending response body to', destination);
        }
    })

}

const checkState=()=>{
    return new Promise((resolve,reject)=>{
        chrome.storage.local.get(["state"]).then((result) => {

            if(result.state){
                state=result.state
                resolve(state)
            }
            else{
                state='ON'
                chrome.storage.local.set({state:'ON'}).then(async()=>{
                    resolve(state)
                })  
            }
          });
    })
    
}

const checkUser=()=>{
    return new Promise((resolve,reject)=>{
        chrome.storage.local.get(["userId"]).then((result) => {
            if(result.userId){
                userId=result.userId
                resolve(userId)
            }
            else{
                resolve('None')
            }
          });
    })
    
}

const getSchedules=()=>{
    return new Promise(async(resolve,reject)=>{
        console.log('Fetching schedules for',userId);
        if(userId){
            // let schedulesUrl=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules?where=userID%3D'${userId}'`
            let schedulesUrl=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/schedules?where=userID%3D'${userId}'`

            let trial=0
            let found=false
            let res

            while(trial<20 && !found){
                try{
                    res=await fetch(schedulesUrl,{
                        method:'GET',
                        headers:{
                            'Content-Type':'application/json'
                        }
                    })
                    found=true
                }
                catch{
                    trial+=1
                }
            }

            if (!found) {
                resolve('Network error.Could not fetch rules')
            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    console.log('Schedules...',result)
                    resolve(result)
    
                }else{
                    resolve(`Error fetching schedules for ${userId}`)
                }
            }

        }else{
            resolve('No user Id')
        }
        
    })
}


const isValidUrl=(string) =>{
    let url;
    try {
      url = new URL(string);
    } catch (_) {
      return false;
    }
    return true
}  
const checkUrls=(rule)=>{

    let actual_first
    let page_first
    let page_rest

    let url_first
    let url_rest

    

    if(rule.target_page_url){
        actual_first=rule.target_page_url
        if(rule.target_page_url.includes('*')){
            page_first=rule.target_page_url.split('*')[0]
            page_rest=rule.target_page_url.split('*').slice(1)
        }else{
            page_first=rule.target_page_url
        }    
        
        if(isValidUrl(page_first)){
            if(rule.target_request_url){
                if(rule.target_request_url.includes('*')){
                    url_first=rule.target_request_url.split('*')[0]
                    url_rest=rule.target_request_url.split('*').slice(1)
                }else{
                    url_first=rule.target_request_url
                }

                if(isValidUrl(url_first)){
                    let fmt_obj={}
                    fmt_obj['destination']=rule.destination_webhook_url
                    fmt_obj['label']=rule.rule_label
                    fmt_obj['methods']=rule.target_request_method
           
                    fmt_obj['page_first']=page_first
                    fmt_obj['page_rest']=page_rest?page_rest:[]

                    fmt_obj['url_first']=url_first
                    fmt_obj['url_rest']=url_rest?url_rest:[]
                    fmt_obj['origin_page']=actual_first

                    return fmt_obj
                }
                else{
                    console.log(url_first,' is invalid. Excluding rule ') 
                    return false
                }
            }
            else{
                console.log('no target_request_url in rule.Excluding rule')
                return false 
            }
            
        }
        else{
            console.log('Excluding rule with invalid url',rule)
            return false 
        }
    }
    else{
        console.log('no target_page_url in rule,excluding rule')
        return false
    }
}

const formartRules=(raw_rules)=>{

    return new Promise((resolve,reject)=>{
        const format_rules=[]

        let enabled_rules=[]

        raw_rules.forEach(rule=>{
            // If rule.status
            if(rule.rule_status){
                enabled_rules.push(rule)
            }
            
        })

        console.log('Enabled rules...',enabled_rules);

        if(enabled_rules.length>0){
            enabled_rules.forEach(rule=>{
                let rule_status=checkUrls(rule)
                if(rule_status){
                    format_rules.push(rule_status)
                }
            })

            resolve(format_rules)
        }
        else{
            resolve(format_rules)
        }
    })

}


const getRules=()=>{
   
    return new Promise(async(resolve,reject)=>{
            if(userId){
                console.log('Fetching rules for',userId,' ...')
                let rulesUri=`https://api.backendless.com/37E1F0EE-D523-A1AA-FFD8-04537784C000/C49B6FF0-70A7-4E2B-90CD-CEB85482B5C6/data/rule?where=userID='${userId}'`
                
                let trial=0
                let found=false
                let res

                while(trial<20 && !found){
                    try{
                        res=await fetch(rulesUri,{
                            method:'GET',
                            headers:{
                                'Content-Type':'application/json'
                            }
                        })
                        found=true
                    }
                    catch{
                        trial+=1
                    }
                }

                if(!found){
                    resolve('Network error.Could not fetch rules')

                }else{
                    if(res.status==200){
                        let result=await res.json()
                        resolve(result)
                    }else{
                        resolve(`Error fetching rules for ${userId}`)
                    }
                }

            }else{
                resolve('Please set user id')
            }

    })
}

// initialSet()