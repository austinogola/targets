importScripts("control.js")
importScripts("scrape.js")
importScripts('rulesHandler.js')
let userId
let taskId
let state
let autos

// chrome.runtime.onStartup.addListener(()=>{})


    chrome.runtime.onMessage.addListener(async(request, sender, sendResponse)=>{
        if(request.scraped){
            // console.log(request);
            sendScraped(sender.tab.id,request)
        }
        if(request.message){
            console.log(request);
        }

        if(request.state){
            state=request.state  
        }
        if(request.autos){
            autos=request.autos 
        }
        if(request.setId){
            userId=request.setId
            console.log('userID set to',userId);
            initiateExtension(false)
            // if(request.reload){
            //     console.log('Reloading');
                
            // } 
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
        let winId
        if(request.sched){
            windowsObjs=windowsObjs.map(item=>{
                if(item.schedule==request.finalize){
                    item.stopping=true
                    return item
                }
                else{
                    return item
                }
            })
            chrome.storage.local.set({windows:windowsObjs})
            winId=windowsObjs.filter(item=>item.schedule==request.finalize)[0].id
        }else{
            windowsObjs=windowsObjs.map(item=>{
                if(item.action==request.finalize){
                    item.stopping=true
                    return item
                }
                else{
                    return item
                }
            })
           
            chrome.storage.local.set({windows:windowsObjs})
            winId=windowsObjs.filter(item=>item.action==request.finalize)[0].id
        }
        try{
            chrome.windows.remove(winId,function ignore_error() { void chrome.runtime.lastError; })
        }
        catch(err){
            console.log('Window missing');
        }
        

        
        
    }
    if(request.refreshExtension){
        console.log('Refreshing...');
        initiateExtension(true)
    }
    

    if(request.update){
        // console.log(`${request.update} tab: ${sender.tab.id}`)
        if(request.remove){
            if(request.remove==='0'){
                console.log('Preserving tab');
                readPending(sender.tab.id,true)
            }
            else{

                readPending(sender.tab.id,false)
            }
        }
        if(request.remaining){
            chrome.tabs.update(sender.tab.id,{
                url:request.target
            },async(tab)=>{
                let sent=false
                chrome.tabs.onUpdated.addListener(function (tabIdty , info) {
                            
                    if (info.status == 'complete') {
                        
                      if(tab.id==tabIdty){
            
                        if(!sent){
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
        let acts=await getActions(true)
        // let action_to_run=acts.filter(item=>item.objectId==request.runOne)[0]
        // let {actions,name,target_page}=action_to_run
        // interactOne(action_to_run)
        // showAction(action_to_run)
        runSingle(request.runOne)
    }

    if(request.updateSchedule){
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

const turnOn=()=>{
    chrome.storage.local.set({state:"ON"})
    state='ON'
    console.log(state);
}

const turnOff=()=>{
    chrome.storage.local.set({state:"OFF"})
    state='OFF'
    console.log(state);
}

const sendScraped=async(senderId,data_obj)=>{
    const {destination,html,text,data}=data_obj
    
    let name=data_obj.name

    let rawHTML
    let htmlText

    let res

    let scrapedBody={data,text,html}
    if(!html){
        delete scrapedBody.html
    }
    if(!text){
        delete scrapedBody.text
    }

    res=await fetch(destination+'?'+new URLSearchParams({
        userID:userId,
        task:taskId,
        name:name,
    }),{
        method:'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(scrapedBody)
    })

    if(res.status==200){
        // console.log('sent scraped to',destination);
    }else{
        console.log('Error sending scraped');
    }
    
}

chrome.offscreen.createDocument({
    url:'offscreen.html',
    reasons:[chrome.offscreen.Reason.IFRAME_SCRIPTING],
    justification:'Using eval'
})



const addEverything=()=>{
   
    chrome.storage.local.get(["userId"]).then(async(result) => {
        if(result.userId){
            userId=result.userId
            let rules=await getRules()
            if(rules instanceof Array ){
                // rules=await formartRules(rules)
                rules=rules.filter(rule=>rule.rule_status)
                console.log('Enabled rules...',rules);
                if(rules.length==0){
                    console.log('No rules to add');
                }
                else{
                    newRulesListener(rules)
                    
                }
                
            }
            else{
                console.log(rules);
            }

            let schedules=await getSchedules()
            if(schedules instanceof Array){
                setSchedulesAlarm(schedules)
            }
            else{
                console.log(schedules);
            }
            
            handleScrapes()
        }
        else{
            console.log('No userId');
        }
      });
}

let autos_batch_size=10
let autos_frequency=5

const setSettings=(settingsObj)=>{
    if(settingsObj){
        if(settingsObj.enabled===true){
            state='ON'
            chrome.storage.local.set({state:state})
        }
        else if(settingsObj.enabled===false){
            state='OFF'
            chrome.storage.local.set({state:state})
        }
        else{
            state='ON'
            chrome.storage.local.set({state:state})
        }


        if(settingsObj.auto_enabled===true){
            autos='ON'
            chrome.storage.local.set({autos:autos})
        }
        else if(settingsObj.auto_enabled===false){
            autos='OFF'
            chrome.storage.local.set({autos:autos})
        }
        else{
            autos='ON'
            chrome.storage.local.set({autos:autos})
        }
    
        autos_batch_size=settingsObj.autos_batch_size || 10
        autos_frequency=settingsObj.autos_frequency || 5

        addEverything()
    }
    else{
        console.log('No preset settings.Resolving to default');
        chrome.storage.local.get(["state"]).then((result) => {
            if(result.state){
                state=result.state
                addEverything()
            }
            else{
                state='ON'
                chrome.storage.local.set({state:'ON'}).then(()=>{
                    console.log(state);
                    if(whole){
                        addEverything()
                    }
                    
                })  
            }
            });
    }
    



}

const initiateExtension=(whole)=>{
    chrome.storage.local.remove(["allUserActions","allUserAutos","allUserSchedules"])
    fetch(`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/settings?pageSize=1&where=userID%3D'${userId}'`,{
        method:'GET'
    })
    .then(async response=>{
        let res= await response.json()
        if(res[0]){
            setSettings(res[0])
        }
        else{
            setSettings() 
        }
    })
    
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
    


    let res=await fetch('https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/schedules',{
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

    while(trial<5 && !found){
        try{
            if(type=='play' || type=='pause'){
                let bd={
                    enabled:type=='play'?true:false
                }
                console.log(`Updating action`);
                res=fetch(`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/schedules/${id}`,{
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
                res=fetch(`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/schedules/${id}`,{
                    method:'DELETE',
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
            console.log('Schedule updated...');
        }
        else{
            console.log('Schedule deleted');
            let schedules=await getSchedules()

            if(schedules instanceof Array){
                setSchedulesAlarm(schedules)
            }
            else{
                console.log(schedules);
            }
        }
        
    }

    
}
const scraping1={
    "target_page_url": "*linkedin.com/in/*",
    "destination_webhook_url": "https://www.mywebhook.com",
    "label":"Scraping test",
    "userID":"rob1",
    "status":true,
    "save_html": true,
    "save_text": false,
    "values": [
        {
            "name": "Title",
            "target": "h3.main_title:eq(2)",
            "extract": "text",
        },
        {
            "name": "Link Href",
            "target": "a.link_template",
            "extract": "url",
        },
        {
            "name": "Label",
            "target": "span.t-12.t-black--light.t-normal:contains('Sort')",
            "extract": "other",
            "extract_other": "aria-hidden"
        }
    ],
    "List": {
        "row": "div.profile",
        "columns": [
            {
                "name": "Name",
                "target": "h2",
                "extract": "text"
            },
            {
                "name": "Description",
                "target": "p.description",
                "extract": "text"
            },
            {
                "name": "Link",
                "target": "a.profile_link",
                "extract": "a"
                
            },
            {
                "name": "Picture",
                "target": ".profilepic",
                "extract": "image_url"
            },
            {
                "name": "Html",
                "target": "p",
                "extract": "html"
            }
        ]
    }

}
chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener(async(message,port)=>{
        if(message.checkValues){
            console.log(port);
            console.log('Received check values',message);
            absent=[]
            present=[]
            state?present.push({state}):absent.push('state')
            userId?present.push({userId}):absent.push('userId')
            autos?present.push({autos}):absent.push('autos')
            taskId?present.push({taskId}):absent.push('taskId')
            
            console.log('absent',absent,"present",present);
            if(port){
                port.postMessage({absent:absent,
                    present},()=>{
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
            let act_actions=await getActions(false)
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
            let act_id
            if(message.shed){
                windowsObjs=windowsObjs.map(item=>{
                    if(item.schedule==message.pauseThis){
                        item.paused='Pausing'
                        return item
                    }
                    else{
                        return item
                    }
                })
                chrome.storage.local.set({windows:windowsObjs})
                
                // act_id=await getSchedAction(message.pauseThis)   
            }else{
                windowsObjs=windowsObjs.map(item=>{
                    if(item.action==message.pauseThis){
                        item.paused='Pausing'
                        return item
                    }
                    else{
                        return item
                    }
                })
                chrome.storage.local.set({windows:windowsObjs})
            }
            
        }
        if(message.playThis){
            let act_id
            if(message.shed){
                windowsObjs=windowsObjs.map(item=>{
                    if(item.schedule==message.playThis){
                        delete item.paused
                        return item
                    }
                    else{
                        return item
                    }
                })
                chrome.storage.local.set({windows:windowsObjs})
                
                // act_id=await getSchedAction(message.playThis)   
            }else{
                windowsObjs=windowsObjs.map(item=>{
                    if(item.action==message.playThis){
                        delete item.paused
                        return item
                    }
                    else{
                        return item
                    }
                })
                chrome.storage.local.set({windows:windowsObjs})
            }
        }
    })        

})

// let freeport = chrome.runtime.connect({
//     name: "freePort"
// });
// freeport.postMessage({popupRefresh:true})

const getSchedAction=async(sched_id)=>{
    return new Promise(async(resolve,reject)=>{
        let running=await chrome.storage.local.get('running_actions')
        let running_actions=running.running_actions

        if(running_actions[0]){
            let relOb=running_actions.filter(ob=>ob.sched==sched_id)[0]
            if(relOb){
                let act_id=relOb.act_id
                if(act_id){
                    resolve(act_id)
                }
            }
        }
        else{
            resolve(null)
        }
    })
    
}
chrome.storage.local.set({windows:[]})
let windowsObjs=[]


const checkPause=async(act_id)=>{
    return new Promise(async(resolve,reject)=>{

        const checkIf=(id)=>{
            let relV=windowsObjs.filter(item=>item.action==id)[0]
            if(relV && relV.paused){
                if(relV.paused=='Pausing'){
                    windowsObjs=windowsObjs.map(item=>{
                        if(item.action==id){
                            item.paused='Paused'
                            return item
                        }
                        else{
                            return item
                        }
                    })
                    chrome.storage.local.set({windows:windowsObjs})
                }
                return true
            }
            else{
                return false
            }
            
        }

        while(checkIf(act_id)){
            await sleep(300)
        }
        resolve(act_id)

        
        
    })
}


const getActions=(log)=>{
    return new Promise(async(resolve,reject)=>{
        if(userId){
            let actionsUri=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/action?pageSize=100&where=userID%3D'${userId}'`

            let trial=0
            let found=false
            let res

            while(trial<5 && !found){
                try{
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
                    
                    resolve(result) 
                }else{
                    resolve(`Error fetching actions for ${userId}`) 
                    console.log(res);
                }
    
            }

        }
        else{
            resolve('No user Id')
        }
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
        delayInMinutes:autos_frequency,
        periodInMinutes:autos_frequency
    })
    
    let allSchedIds=[]
    schedules.forEach(item=>{
        allSchedIds.push(item.objectId)
    })
    let alreadySet=[]
    let newScheds=[]

    const setThemAll=async(schedules)=>{
        return new Promise(async(resolve,reject)=>{
            let curr_time
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
                if(obj.period==1){
                }else{
                    // console.log(`Set "${obj.name}" every ${obj.period} ${obj.every}s  from now -${curr_time}`);
                }
                
                
            })
            let date=new Date()
            let hours=date.getHours()
            let mins=date.getMinutes()
            mins=mins<10?`0${mins}`:mins
    
            curr_time=`${hours}:${mins}`

            const allAlarms=await chrome.alarms.getAll()
            console.log('schedules',allAlarms,'set at:',curr_time);
            resolve(schedules)
            

        })
        
    }

    setThemAll(schedules)
    
}
const runningWindows=[]

const completeAction=(windId)=>{
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
            
            
            // chrome.windows.update(window_Id,{state:"fullscreen"})
            resolve(window.tabs[0].id)

        })

    })
}

let oneRunning=false

const getAutoActions=()=>{
    return new Promise(async(resolve,reject)=>{
            let auto_actionsUri=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/auto?pageSize=${autos_batch_size}&where=userID%3D'${userId}'%20AND%20complete%20%3D%20false&sortBy=%60created%60%20desc`
            let trial=0
            let found=false
            let res

            while(trial<5 && !found){
                try{
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
                resolve('Network Error');

            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    resolve(result) 
                }else{
                    resolve(`Could not fetch for ${userId}`) 
                    console.log(res);
                }
    
            }

        
    })

}

const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const postPer=async(runTab,obj,runWin,objectId)=>{

    return new Promise(async(resolve,reject)=>{
        let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
        // console.log(port);

        if(pp=='missing'){
            resolve('missing')
        }else{
            chrome.runtime.onConnect.addListener(port=>{
                if(port.name=='ctrl_port'){
                   
                    if(obj){
                        port.postMessage(obj,()=>{
                        
                            if (chrome.runtime.lastError) {}
                        })
                        obj=null
                    }
                     
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
        }
        

    })
}

const navPort=(tabz,url)=>{
    return new Promise((resolve,reject)=>{
        chrome.tabs.update(tabz,{url:url},async(tab)=>{
            let sent=false
            chrome.tabs.onUpdated.addListener(function (tabIdty , info) {
                        
                if (info.status == 'complete') {
                    
                  if(tabz==tabIdty){
        
                    resolve('Finished loading')
                    
                  }
                }
              });
        })
    })
}


let winObs=[]

const checkWindows=(winID)=>{
    return new Promise(async(resolve,reject)=>{
        const checkIf=(id)=>{
            let relV=windowsObjs.filter(item=>item.id==winID)[0]
            if(relV){
                return true
            }
            else{
                return false
            }
            
        }

        while(checkIf(winID)){
            await sleep(300)
        }
        resolve('missing')
        
    })
}



const finishProgress=async(act_id,sched_id)=>{
   
    //act_ids
    Act_Ids=Act_Ids.filter(item=>item!=act_id)
    if(!Act_Ids[0]){
        Act_Ids=[]
    }
    chrome.storage.local.set({action_ids:Act_Ids}) 

    //schedIds
    Sched_Ids = Sched_Ids.filter(item=>item!=sched_id)
    if(!Sched_Ids[0]){
           
    }else{
        Sched_Ids=[] 
    }
    chrome.storage.local.set({sched_ids:Sched_Ids})

    //action_objects
    Running_Acts = Running_Acts.filter(item=>item.act_id!=act_id)
    
    if(!Running_Acts[0]){
        Running_Acts=[]
    }
    chrome.storage.local.set({running_actions:Act_Ids}) 
    
}


chrome.windows.onRemoved.addListener((windowId)=>{
    let newWins=windowsObjs.filter(item=>item.id==windowId)[0]
    if(newWins){
        windowsObjs=windowsObjs.filter(item=>item.id!=windowId)
        if(windowsObjs[0]){
            chrome.storage.local.set({windows:windowsObjs})
        }
        else{
            chrome.storage.local.set({windows:[]})
        }
    }
})

const makeShoWin=(url,act_id,sched_id,active)=>{
    return new Promise((resolve,reject)=>{
        chrome.windows.create({
            focused:active?true:false,
            type:'normal',
            height:900,
            width:1600,
            url:url
        },(window)=>{
            // winObs.push({objectId,window:window.id})
            windowsObjs.push({id:window.id,action:act_id,schedule:sched_id})
            chrome.storage.local.set({windows:windowsObjs})
            resolve([window.tabs[0].id,window.id])

        })
    })
}

const updateAuto=async(id)=>{
    let ob={
        complete:true
    }

    let updateUrl=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/auto/${id}`

    let trial=0
    let found=false
    let res

    while(trial<5 && !found){
        try{
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
        }else{
            console.log(`Error updating auto action`) 
        }

    }
    
}
function nth(n){return["st","nd","rd"][((n+90)%100-10)%10-1]||"th"}


const initiateAutos=async()=>{
    let auto_acts=await getAutoActions()
    if(auto_acts instanceof Array){
        let comps=auto_acts.filter(item=>item.complete==false)
        for(let i=0;i<comps.length;i++){
            let autosState=await checkAutosState()
            if(autosState=='OFF'){
                break
            }
            else{
                let fin=await showAutoAction(auto_acts[i])
                updateAuto(auto_acts[i].objectId)
                await sleep(10000)
            }
            
        }
        
    }
}

if (chrome.runtime.lastError) {
    console.log(chrome.runtime.lastError.message);
    console.log('Clean');
}


chrome.alarms.onAlarm.addListener(async(Alarm)=>{
    let date=new Date()
    let hours=date.getHours()
    let mins=date.getMinutes()

    if(Alarm.name.includes('~')){
        mins=mins<10?`0${mins}`:mins

        let curr_time=`${hours}:${mins}`
        console.log('Time!!',curr_time,Alarm.name.split('~')[0]);
       

        if(state=='OFF'){
            
        }
        else{
            console.log('Checking schedule');
            let schedId=Alarm.name.split('~')[2]
            let schedulez=await getSchedules()


            let rel={enabled:true}
            if(schedulez instanceof Array){
                rel=schedulez.filter(item=>item.objectId==schedId)[0]
            }


            if(rel.enabled==true){
                console.log('Schedule enabled. Running');
                let action_id=Alarm.name.split('~')[1]
                let schedule_name=Alarm.name.split('~')[0]
                // console.log(Alarm.name)
                
                let schid=rel.objectId
                
                runSingle(action_id,schid) 
                updateLastRun(rel)  
            }else{
                console.log('Not enabled');
            }
        
            
        }

    }
    else if(Alarm.name=='startAutos'){
        if(!autos || autos=='ON'){
            initiateAutos()
        }else if(autos=='OFF'){
            
        }
        
    }
    else{

        let schedules=await getSchedules()

        if(schedules instanceof Array){
            setSchedulesAlarm(schedules)
        }
        else{
        }

        chrome.tabs.query({
            windowType:'normal'
        },(tabs)=>{
            tabs.forEach(tab=>{
                if(tab.id==parseInt(Alarm.name)){
                    chrome.tabs.remove(tab.id,function ignore_error() { void chrome.runtime.lastError; })
                }
            })
        })
        
    }
    
})

const updateLastRun=async(sched_obj)=>{
    const theTime = new Date().getTime()

    let upDateObj={
        lastrun:theTime
    }

    let updateUrl=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/schedules/${sched_obj.objectId}`
            let trial=0
            let found=false
            let res

            while(trial<10 && !found){
                try{
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
                }else{
                    console.log(`Error updating schedule`) 
                }
    
            }



}

const actionCheck=async(action_id,schedule_id)=>{
    return new Promise(async(resolve,reject)=>{
        await sleep(30000)
        if(widthObjs[0]){
            rel=widthObjs.filter(item=>item.act_id==action_id)[0]
            if(rel){
                if(!rel.width){
                    winId=windowsObjs.filter(item=>item.action==action_id)[0].id
                    try{
                        chrome.windows.remove(winId,function ignore_error() { void chrome.runtime.lastError; })
                    }
                    catch(err){
                        console.log('Window missing');
                    }
                    await sleep(3000)
                    schedule_id?runSingle(action_id,schedule_id): runSingle(action_id)
                    resolve('Done')
                }
            }
        }
        else{
            resolve('None')
        }
    })
}

const runSingle=async(action_id,schedule_id)=>{
    // actionCheck(action_id,schedule_id)
    let actions=await getActions(true)

    if(actions instanceof Array){
        
        let toRun=actions.filter(item=>item.objectId==action_id)[0]
        showAction(toRun,schedule_id)
    }
    else{
        // console.log(actions);
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
                    let remove=true

                    if(typeof(obj.remove)=='undefined' || obj.remove==null ){
                        remove=true

                    }else{
                        remove=obj.remove 
                    }

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

const updateProg=async(id,total,curr_len,anch,now)=>{
    Running_Acts=Running_Acts.map(item=>{
        if(item.act_id==id){
            item.flow_pos=isNaN(now)?item.flow_pos+1:now
            item.flows=total?total:item.flows
            item.flow=anch?anch:item.flow
            return item

        }
        else{
            return item
        }
    })
      
    // console.log('Update',Running_Acts[0]);
    chrome.storage.local.set({running_actions:Running_Acts})
            

}

let pausedActs=[]
chrome.storage.local.set({allPaused:pausedActs})



const connectRun=async(tabid,obj,remove)=>{

    
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
          
                total+=1
            }
            else if(ob.event){
         
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
        if (chrome.runtime.lastError) {
            console.log('Clean');
        }
    }); 
}

let req_ids=[]



let target_page_urls=[]
let target_request_urls=[]

chrome.storage.local.set({rules:[]}) 
let rulesArray=[]



let currentAction=''

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
        if(userId){
            let schedulesUrl=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/schedules?pageSize=100&where=userID%3D'${userId}'`

            let trial=0
            let found=false
            let res

            while(trial<5 && !found){
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
                resolve('Please check connection')
            }
            else{
                if(res.status==200){
                    let result=await res.json()

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
                   
                    return false
                }
            }
            else{
                
                return false 
            }
            
        }
        else{
            // console.log('Excluding rule with invalid url',rule)
            return false 
        }
    }
    else{
        // console.log('no target_page_url in rule,excluding rule')
        return false
    }
}

const newFormatules=(raw_rules)=>{
    const enabled_rules=[]
    raw_rules.forEach(rule=>{
        // If rule.status
        if(rule.rule_status){
            enabled_rules.push(rule)
        }
        
    })

    console.log('Enabled rules',enabled_rules);
    return (enabled_rules)
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

            console.log('Final rules',format_rules);
            resolve(format_rules)
        }
        else{
            resolve(format_rules)
        }
    })

}
const getScrapes=async()=>{

    return new Promise(async(resolve,reject)=>{
        let scUrl=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/scraping?where=userID%3D'${userId}'`

        let res=await fetch(scUrl,{
            method:'GET',
            headers:{"Content-Type":"application/json"}
        })

        if(res.status==200){
            let response =await res.json()
            console.log('scrapes',response);
            resolve(response)
            
        }
        else{
            console.log('Error fetching scrapes');
            console.log(res);
        }
    })
}

const getRules=()=>{
   
    return new Promise(async(resolve,reject)=>{
            if(userId){
                console.log('Fetching rules for',userId,' ...')
                let rulesUri=`https://eu-api.backendless.com/F1907ACC-D32B-5EA1-FFA2-16B5AC9AC700/E7D47F5F-7E77-4E8D-B6CE-E2E7A9C6C1C2/data/rule?pageSize=100&where=userID='${userId}'`
                
                let trial=0
                let found=false
                let res

                while(trial<5 && !found){
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

let date=new Date()
let hours=date.getHours()
let mins=date.getMinutes()
mins=mins<10?`0${mins}`:mins

curr_time=`${hours}:${mins}`

console.log('Initiated at',curr_time);

const keepAlive = () => setInterval(chrome.runtime.getPlatformInfo, 20e3);
chrome.runtime.onStartup.addListener(keepAlive);
keepAlive();

chrome.gcm.register(['803443465858'],(regId)=>{
    console.log('chrome_identity_key',regId);
  })

chrome.gcm.onMessage.addListener(message=>{
    if(message.data['gcm.notification.refresh']){
        console.log('remote refresh.Refreshing');
        initiateExtension(true)
    }

    if(message.data['gcm.notification.enable']){
        console.log('remote enable.');
        turnOn() 
    }

    if(message.data['gcm.notification.disable']){
        console.log('remote disable.');
        turnOff()
    }
})
