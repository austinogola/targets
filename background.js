let userId
let taskId
let state

chrome.runtime.onMessage.addListener(async(request, sender, sendResponse)=>{
    if(request.state){
        state=request.state
        chrome.storage.local.set({state:state}).then(async()=>{
            console.log(state);
            if(request.state=='ON'){
                // initialSet()
                initiateExtension()
            }
        })  
    }
    if(request.setId){
        userId=request.setId
        console.log('user Id set to',userId);
        chrome.storage.local.set({userId:userId}).then(async()=>{
            // initialSet()
            initiateExtension()
        })  
    }

    if(request.setTask){
        taskId=request.setTask
        chrome.storage.local.set({taskId:taskId}).then(async()=>{
            console.log(`task:`,taskId);
        })  
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
                            executeMe(tabIdty,request.remaining)
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
        interactOne(action_to_run)
    }

    if(request.updateAction){
        let id=request.updateAction
        let action=request.updateTo
        updateAction(id,action)
    }

    if(request.copyOne){
        let {copyOne,period,every,actionId,initStatus}=request
        makeSchedule(copyOne,period,every,actionId,initStatus)
    }
})

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
const initiateExtension=()=>{
    chrome.storage.local.get(["state"]).then((result) => {
        if(result.state){
            state=result.state
            if(state=='OFF'){
                console.log('0FF');
            }
            else{
                console.log(state);
                checkUs()
            }
        }
        else{
            chrome.storage.local.set({state:'ON'}).then(async()=>{
                state='ON'
                console.log(state);
                checkUs()
            })  
        }
      });
}

initiateExtension()

const makeSchedule=async(copyOne,period,every,actionId,initStatus)=>{
    let schedules=await getSchedules()
    let rel_sch=schedules.filter(item=>item.objectId==copyOne)[0]
    
    let {name}=rel_sch

    rel_sch.name=`${name} (copy)`

    if(every){
        rel_sch.every=every
    }
    if(period){
        rel_sch.period=parseInt(period)
    }
    if(actionId){
        rel_sch.action=actionId
    }

    if(initStatus=='false'){
        rel_sch.enabled=false
    }else{
        rel_sch.enabled=true
    }

    delete rel_sch.objectId
    delete rel_sch.created
    delete rel_sch.updated


    let res=await fetch('https://matureshock.backendless.app/api/data/schedules',{
        method:'POST',
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify(rel_sch)
    })

    if(res.status==200){
        let response =await res.json()
        console.log('Successfully created new schedule',response);
    }
    else{
        console.log('Failed to create schedule');
    }

}

const updateAction=async(id,type)=>{
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
                res=fetch('https://matureshock.backendless.app/api/data/schedules',{
                method:'PUT',
                headers:{
                    'Content-Type':'application/json'
                },
                body:JSON.stringify(bd)
            })
            found=true
            }
            else if(type=='delete'){
                res=fetch('https://matureshock.backendless.app/api/data/schedules',{
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
}

chrome.runtime.onConnect.addListener((port)=>{
    console.log('Conection made',port)
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
            port.postMessage({absent:absent})
        }

        if(message.fetchSchedules){
            let schedules=await getSchedules()
            port.postMessage({schedules:schedules})
        }
        if(message.fetchActions){
            let act_actions=await getActions()
            port.postMessage({act_actions:act_actions})
            if(act_actions instanceof Array){
                console.log('It is an array');
                
            }
        }

        if(message.fetchOne){
            let schedules=await getSchedules()
            let theOne=schedules.filter(item=>item.objectId==message.fetchId)[0]
            port.postMessage({schedule:theOne})
        }
    })        

})


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
            let actionsUri=`https://matureshock.backendless.app/api/data/action?pageSize=100&where=userID='${userId}'`

            let trial=0
            let found=false
            let res

            while(trial<20 && !found){
                try{
                    console.log(`Fetching ${userId} actiions`);
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
                resolve('Please check network connection');

            }
            else{
                if(res.status==200){
                    let result=await res.json()
                    console.log(result);
                    // let toRun=result.filter(item=>item.objectId==id)
                    resolve(result) 
                }else{
                    resolve(`Error fetching actions for ${userId}`) 
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
            delayInMinutes:3,
        })
    }
}

const setSchedulesAlarm=(schedules)=>{
    chrome.alarms.clearAll()
    schedules.forEach(obj=>{
        let minutes
        let wak
        let period=obj.period?obj.period:1
        if(obj.every=='day' || obj.every=='days'){
            // minutes=1440
            minutes=30*period
            wak='30 mins'
        }
        else if(obj.every=='week' || obj.every=='weeks'){
            // minutes=10080
            minutes=60*period
            wak='1 hour'
        }
        else if(obj.every=='hour' || obj.every=='hours'){
            // minutes=60
            minutes=5*period
            wak='5 minutes'
        }
        else if(obj.every=='minute' || obj.every=='minutes'){
            minutes=1*period
            wak='exactly 1 minute'
        }
        
        chrome.alarms.create(`${obj.name}~${obj.action}`,{
            delayInMinutes:minutes,
            periodInMinutes:minutes
        })
        let date=new Date()
        let hours=date.getHours()
        let mins=date.getMinutes()
        mins=mins<10?`0${mins}`:mins

        let curr_time=`${hours}:${mins}`
        if(obj.period==1){
            console.log(`Set "${obj.name}" for every ${obj.every} (${wak}) from now - ${curr_time}`);
        }else{
            console.log(`Set "${obj.name}" for every ${obj.period} ${obj.every}s (${obj.period} * ${wak}) from now -${curr_time}`);
        }
        
    })
    console.log('All schedules set');
    return(schedules)
}

const makeWindow=(url)=>{
    
    return new Promise(async(resolve,reject)=>{

        chrome.windows.create({
            focused:false,
            type:'popup',
            height:900,
            width:1600,
            // left:60,
            // top:200,
            // state:'maximized',
            url:url
        },(window)=>{
            // window_Id=window.id
            chrome.windows.onRemoved.addListener(
                (windId)=>{
                    if(windId==window){
                        window=false
                    }
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
            let schedule_id=Alarm.name.split('~')[1]
            let schedule_name=Alarm.name.split('~')[0]
            console.log(`Running "${schedule_name}"`);
    
            runSingle(schedule_id)
    
            if(oneRunning){
                console.log('Another action running.Pushing to pending');
                pending.push({schedule_id:schedule_id,schedule_name:schedule_name})
            }
            else{
                console.log('None Running');
                oneRunning=schedule_id
                runSingle(schedule_id)   
            }   
            
            
        }

    }else{
        chrome.tabs.remove(parseInt(Alarm.name))
    }
    
})

const runSingle=async(id)=>{
    let actions=await getActions()

    if(actions instanceof Array){
        
        let toRun=actions.filter(item=>item.objectId==id)[0]
        console.log('Running',toRun);
        // console.log('Specific to be run',toRun);
        interactOne(toRun)
    }
    else{
        console.log(actions);
    }
}


const interactOne=async(obj)=>{
    let tabId
    
    tabId=await makeWindow(obj.target_page)
    
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



const connectRun=async(tabid,obj,remove)=>{
    console.log('ConnectRun',obj);
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

        arranged_arr.push({remove:remove})


        console.log(arranged_arr);
        executeMe(tabid,arranged_arr)
        })
    
    
}

const executeMe=(tabId,arr)=>{
    chrome.tabs.sendMessage(tabId, {
        beginRun:true,
        acts:arr
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
            let schedulesUrl=`https://matureshock.backendless.app/api/data/schedules?where=userID%3D'${userId}'`
        
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
                let rulesUri=`https://matureshock.backendless.app/api/data/rule?where=userID='${userId}'`
                
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