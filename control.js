const calcExp=(obj)=>{
    let arr=obj.flow
    let total=0
    arr.forEach(item=>{
        if(item.event){
            if(item.event=='navigate'){
                total+=2
            }
            else{
                total+=1
            }
        }
        else if(item.wait){
            total+=item.wait
        }
    })
    if(obj.repeat){
        total*=obj.repeat
    }

    return total

}

const showAction=async(act_ob,sched)=>{
    if(act_ob){
        if(sched){
            initProg(act_ob.objectId,sched)
        }
        else{
            initProg(act_ob.objectId)
        }

    return new Promise(async(resolve,reject)=>{
        let idS
        if(sched){
            idS=await makeShoWin(act_ob.target_page,act_ob.objectId,sched,act_ob.active)
        }else{
            idS=await makeShoWin(act_ob.target_page,act_ob.objectId,null,act_ob.active)
        }

        let runTab=idS[0]
        let runWin=idS[1]
        let allActs=act_ob.actions

        const checkCompletion=()=>{
            return new Promise(async(resolve,reject)=>{
                chrome.tabs.onUpdated.addListener(async function async(tabIdt , info,tab) {
                if (info.status === 'complete') {
                    
                    if(tabIdt==runTab){
                        await sleep(500)
                        chrome.tabs.query({status:'complete',},(tabs)=>{
                            tabs.forEach(tab=>{
                                if(tab.id==runTab){
                                    resolve('LOaded')
                                }
                            })
                        })
                        
                    }
                }
            });
            })
        }


        let comp=await Promise.race([checkCompletion(),checkWindows(runWin),sleep(10000)])

        let name=act_ob.name
        let ruleId=act_ob.ruleId
        
        let lenses=[]
        allActs.forEach(item=>{
            item.exp=calcExp(item)
        })
        const sump=[...allActs]
    
        // console.log(allActs);
        // lenProg(act_ob.objectId,allActs,allActs[0].exp)
        if(comp=='missing'){
          
            sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
        }
        else{
            let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])

            if(pp=='missing'){
               
                sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
            }
            else{
                for(let i=0;i<allActs.length;i++){
                    let currentAction=allActs[i]

                    setSubs(act_ob.objectId,sump.length,sump[i].exp,i+1)
                    
                    let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])
                    if(pp=='missing'){
                        sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
                    }else{
                        let subLength=currentAction.flow.length
                        let repeat=currentAction.repeat?currentAction.repeat:1
                        const maliza=await Promise.race([handleActPart(currentAction,runTab,runWin,act_ob.objectId,sump.length,sump[i].exp,i+1,name),checkWindows(runWin)])
                        if(maliza=='missing'){
                            sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
                        }
                    }
                    
                }
                await sleep(300)
                finishProgress(act_ob.objectId)
                if(act_ob.remove==true){
                    chrome.windows.remove(runWin,function ignore_error() { void chrome.runtime.lastError; })
                }
                else{
                    // completeShow(act_ob.objectId)
                }
            }


            
        }
        
        resolve('missing')
        return
    })
}
}

const showAutoAction=async(act_ob,sched)=>{
    if(act_ob){
        if(sched){
            initProg(act_ob.objectId,sched)
        }
        else{
            initProg(act_ob.objectId)
        }

    return new Promise(async(resolve,reject)=>{
        let idS
        if(sched){
            idS=await makeShoWin(act_ob.target_page,act_ob.objectId,sched,act_ob.active)
        }else{
            idS=await makeShoWin(act_ob.target_page,act_ob.objectId,null,act_ob.active)
        }

        let runTab=idS[0]
        let runWin=idS[1]
        let allActs=act_ob.actions

        const checkCompletion=()=>{
            return new Promise(async(resolve,reject)=>{
                chrome.tabs.onUpdated.addListener(async function async(tabIdt , info,tab) {
                if (info.status === 'complete') {
                    
                    if(tabIdt==runTab){
                        await sleep(500)
                        chrome.tabs.query({status:'complete',},(tabs)=>{
                            tabs.forEach(tab=>{
                                if(tab.id==runTab){
                                    resolve('LOaded')
                                }
                            })
                        })
                        
                    }
                }
            });
            })
        }


        let comp=await Promise.race([checkCompletion(),checkWindows(runWin),sleep(10000)])

        let name=act_ob.name
        let ruleId=act_ob.ruleId
        
        let lenses=[]
        allActs.forEach(item=>{
            item.exp=calcExp(item)
        })
        const sump=[...allActs]
    
        // console.log(allActs);
        // lenProg(act_ob.objectId,allActs,allActs[0].exp)
        if(comp=='missing'){
          
            sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
        }
        else{
            let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])

            if(pp=='missing'){
               
                sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
            }
            else{
                for(let i=0;i<allActs.length;i++){
                    let currentAction=allActs[i]

                    setSubs(act_ob.objectId,sump.length,sump[i].exp,i+1)
                    
                    let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])
                    if(pp=='missing'){
                        sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
                    }else{
                        let subLength=currentAction.flow.length
                        let repeat=currentAction.repeat?currentAction.repeat:1
                        const maliza=await Promise.race([handleAutoActPart(currentAction,runTab,runWin,act_ob.objectId,sump.length,sump[i].exp,i+1,name),checkWindows(runWin)])
                        if(maliza=='missing'){
                            sched?finishProgress(act_ob.objectId,sched):finishProgress(act_ob.objectId)
                        }
                    }
                    
                }
                await sleep(300)
                finishProgress(act_ob.objectId)
                if(act_ob.remove==true){
                    chrome.windows.remove(runWin,function ignore_error() { void chrome.runtime.lastError; })
                }
                else{
                    // completeShow(act_ob.objectId)
                }
            }


            
        }
        
        resolve('missing')
        return
    })
}
}
let Act_Ids=[]
chrome.storage.local.set({action_ids:[]})
chrome.storage.local.set({running_actions:[]})
let Running_Acts=[]
chrome.storage.local.set({sched_ids:[]})
let Sched_Ids=[]

const initProg=async(act_id,sched_id)=>{
    //actionIDs
    Act_Ids.push(act_id)
    chrome.storage.local.set({action_ids:Act_Ids})

    //action objects
    
    let obj={
        act_id:act_id
    }
    
    if(sched_id){
        obj={
            act_id:act_id,
            sched:sched_id
        }
        
        Sched_Ids.push(sched_id)
        chrome.storage.local.set({sched_ids:Sched_Ids})

    }
    Running_Acts.push(obj)
    chrome.storage.local.set({running_actions:Running_Acts})

}

const lenProg=async(id,acts,flength)=>{
    //action object
    let running=await chrome.storage.local.get('running_actions')
    let running_acts=running.running_actions


    if(running_acts[0]){
        let relOb=running_acts.filter(ob=>ob.act_id==id)[0]
        let remOb=running_acts.filter(ob=>ob.act_id!=id)
        let lenn=acts.length

        if(relOb){
            relOb.flows=lenn+1
            relOb.flow=1
            relOb.flow_len=flength+1
            relOb.flow_pos=1

            running_acts=[]
            running_acts.push(relOb)
            if(remOb[0]){
                running_acts.concat(remOb)
            }
            chrome.storage.local.set({running_actions:running_acts})
            console.log('Len Prog',running_acts);
        }

        
        

       
}


}


const setSubs=async(id,total,curr_length,anch)=>{

    Running_Acts=Running_Acts.map(item=>{
        if(item.act_id==id){
            item.flows=total
            item.flow=anch
            item.flow_len=curr_length
            item.flow_pos=1
            return item
        }
        else{
            return item
        }
    })
    chrome.storage.local.set({running_actions:Running_Acts})
    

}

const checkRuleTrigger=(ruleId,times)=>{
    return new Promise(async(resolve,reject)=>{
        // let rull=await chrome.storage.local.get('rules')
        // let rules=rull.rules
        await sleep(1500)
        let relevantRule=rulesArray.filter(rule=>rule.id==ruleId)[0]
        let remainingRules=rulesArray.filter(rule=>rule.id!=ruleId)

        if(relevantRule){
            let previous=relevantRule.lastTriggered
            let current=relevantRule.currentTrigger
            let timesNotTriggered=relevantRule.timesNotTriggered
            if(previous==current){
                timesNotTriggered+=1
                relevantRule.timesNotTriggered=timesNotTriggered
                console.log('times without trigger:',Math.round(relevantRule.timesNotTriggered/2));
            }else{
                relevantRule.timesNotTriggered=0
            }

            relevantRule.lastTriggered=current
             
            if(relevantRule.timesNotTriggered/2==times){
                // console.log(relevantRule);
                console.log('aborting');
                resolve('abort')
            }
            else{
                // console.log(relevantRule);
                console.log('proceeding');
                resolve('proceed')
            }

            remainingRules.push(relevantRule)
            rulesArray=remainingRules
            chrome.storage.local.set({rules:rulesArray})
        }
        else{
            console.log('None found');
            resolve('proceed')
        }

        
    })
}

const checkAutosState=()=>{
    return new Promise((resolve,reject)=>{
        if(autos=='OFF'){
            resolve('OFF')
        }
        else{
            resolve('ON')
        }
    })
}
const handleAutoActPart=(obj,runTab,runWin,objectId,total,curr_len,anch,name)=>{

    return new Promise(async(resolve,reject)=>{
        let flow=obj.flow
        let repeat=obj.repeat?obj.repeat:1
        let stopper=obj.stop_if_present?obj.stop_if_present:null
        let timeout=obj.timeout?obj.timeout:5
        let repeatsForNull=obj.stop_if_repeats||null
        let ruleId=obj.stop_if_rule||null

        let sub_len=flow.length
        

        if(sub_len==0){
            resolve('Done with sub-flow')
        }
        else{
            // console.log('Running sub',flow, `(${repeat})`);
            let flowN=[...flow]
            let rep=0
            for(let i=0;i<repeat;i++){ 

                let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                if(pp=='missing'){
                    resolve('missing')
                    return
                }else{
                    let autosState=await checkAutosState()

                    if(autosState=='OFF'){
                        resolve('stopped')
                        break
                    }
                    else{
                        let tidy=await Promise.race([startFlowingAutos(flowN,stopper,runTab,runWin,objectId,total,curr_len,anch,rep,name),checkWindows(runWin)])
                        if(tidy){
                            if(tidy=='stop element'){
                                resolve('stopped')
                                break
                            }
                            else if(tidy=='missing'){
    
                                resolve('missing')
                                break
                            }
                            else if(tidy=='closed' || tidy=='not loading'){
                                resolve('closed')
                                break
                            }
                            else{
                                if(!isNaN(tidy)){
                                    rep=tidy
                                }
                                
                            }
                        }
                        else{
                            resolve('DONE')
                        }
                    }

                }
                let triggerCheck=await checkRuleTrigger(ruleId,repeatsForNull)
                if(triggerCheck=='abort'){
                    resolve('Done with sub-flow')
                    break
                }
                

            }

            resolve('Done with sub-flow')

        }


    })
}

const handleActPart=(obj,runTab,runWin,objectId,total,curr_len,anch,name)=>{

    return new Promise(async(resolve,reject)=>{
        let flow=obj.flow
        let repeat=obj.repeat?obj.repeat:1
        let stopper=obj.stop_if_present?obj.stop_if_present:null
        let timeout=obj.timeout?obj.timeout:5
        let repeatsForNull=obj.stop_if_repeats||null
        let ruleId=obj.stop_if_rule||null

        let sub_len=flow.length
        

        if(sub_len==0){
            resolve('Done with sub-flow')
        }
        else{
            // console.log('Running sub',flow, `(${repeat})`);
            let flowN=[...flow]
            let rep=0
            for(let i=0;i<repeat;i++){ 

                let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                if(pp=='missing'){
                    resolve('missing')
                    return
                }else{
                    let tidy=await Promise.race([startFlowing(flowN,stopper,runTab,runWin,objectId,total,curr_len,anch,rep,name),checkWindows(runWin)])
                    if(tidy){
                        if(tidy=='stop element'){
                            resolve('stopped')
                            break
                        }
                        else if(tidy=='missing'){

                            resolve('missing')
                            break
                        }
                        else if(tidy=='closed' || tidy=='not loading'){
                            resolve('closed')
                            break
                        }
                        else{
                            if(!isNaN(tidy)){
                                rep=tidy
                            }
                            
                        }
                    }
                    else{
                        resolve('DONE')
                    }

                }
                let triggerCheck=await checkRuleTrigger(ruleId,repeatsForNull)
                if(triggerCheck=='abort'){
                    resolve('Done with sub-flow')
                    break
                }
                

            }

            resolve('Done with sub-flow')

        }


    })
}

const startFlowingAutos=async(flow,stopper,runTab,runWin,objectId,total,curr_len,anch,nos,name)=>{
  
    return new Promise(async(resolve,reject)=>{

        let relTab
        let fak_flow=[...flow]

        let port

        for(let m=0;m<flow.length;m++){
           
            let single_flow=flow[m]
        
            
            let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
            if(pp=='missing'){
           
                resolve('missing')
                return
            }

            else{
                let autosState=await checkAutosState()

                    if(autosState=='OFF'){
                        resolve('stopped')
                        break
                    }
                    else{
                        if(single_flow.wait){
                            // console.log('Waiting ',single_flow.wait,'seconds');
                            for (let man = 0; man < single_flow.wait; man++) {
                                nos+=1
                                await sleep(1000)
                                let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                                if(pq=='missing'){
                                    resolve('missing')
                                    return
                                }
                                updateProg(objectId,total,curr_len,anch,nos)
                                    
                            }
                        }
                        else if(single_flow.event){
                            if(single_flow.event=='scroll'){
                                let targ=single_flow.target
                                let depth=single_flow.depth
                                let obo
                                obo={
                                    doAct:'scroll',target:targ,depth:depth
                                }
            
                                let res=await Promise.race([postPer(runTab,obo,runWin,objectId),checkWindows(runWin)])
                                if(res=='missing'){
                                 
                                    resolve('missing')
                                    return
                                } 
                                nos+=1
                                let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                                if(pq=='missing'){
                                    resolve('missing')
                                    return
                                }
                                updateProg(objectId,total,curr_len,anch,nos)
                            }
                            else if(single_flow.event=='click'){
                                let tmeout=single_flow.timeout?single_flow.timeout:5
                                let targ=single_flow.target
                             
                                let obo
                                obo={
                                    doAct:'click',target:targ,stopper,timeout:tmeout
                                }
                                let res=await Promise.race([postPer(runTab,obo,runWin,objectId),checkWindows(runWin)])
                                if(res=='missing'){
                                   
                                    resolve('missing')
                                    return
                                }
                                nos+=1
                                let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                                if(pq=='missing'){
                                    resolve('missing')
                                    return
                                }
                                updateProg(objectId,total,curr_len,anch,nos) 
                                
                            }
                            else if(single_flow.event=='navigate'){ 
                                nos+=1
                                let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                                if(pq=='missing'){
                                    resolve('missing')
                                    return
                                }
                                updateProg(objectId,total,curr_len,anch,nos)
                                let yport=await Promise.race([navPort(runTab,single_flow.target),checkWindows(runWin)])
                                if(yport=='missing'){
        
                                    resolve('missing')
                                    break
                                }
                                else{
                                    nos+=1
                                    let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                                    if(pq=='missing'){
                                        resolve('missing')
                                        return
                                    }
                                    updateProg(objectId,total,curr_len,anch,nos) 
                                    fak_flow.shift()
                                    let path2=await Promise.race([startFlowingAutos(fak_flow,stopper,runTab,runWin,objectId),checkWindows(runWin)]) 
                                    resolve(path2)
                                }  
                                
                            }
                            else if(single_flow.event=='scrape'){
                                nos+=1
                                let values=single_flow.values?single_flow.values:null
                                let list=single_flow.list?{
                                    base_target:single_flow.list.row,
                                    columns:single_flow.list.columns
                                }:null
        
                                let destination=single_flow.destination_webhook_url
                                let html=single_flow.save_text
                                let text=single_flow.save_html
        
                                let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
        
                                if(pq=='missing'){
                                    resolve('missing')
                                    return
                                }
                                updateProg(objectId,total,curr_len,anch,nos) 
                                chrome.tabs.sendMessage(runTab,{scrapeAll:true,values,list,destination,html,text,name})
        
                            }
                        }
                    }
                
                 
                fak_flow.shift()
            }
            
        }
        // port.disconect()

        resolve(nos)

        
    })
}

const startFlowing=async(flow,stopper,runTab,runWin,objectId,total,curr_len,anch,nos,name)=>{
  
    return new Promise(async(resolve,reject)=>{

        let relTab
        let fak_flow=[...flow]

        let port

        for(let m=0;m<flow.length;m++){
           
            let single_flow=flow[m]
        
            
            let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
            if(pp=='missing'){
           
                resolve('missing')
                return
            }

            else{
                if(single_flow.wait){
                    // console.log('Waiting ',single_flow.wait,'seconds');
                    for (let man = 0; man < single_flow.wait; man++) {
                        nos+=1
                        await sleep(1000)
                        let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                        if(pq=='missing'){
                            resolve('missing')
                            return
                        }
                        updateProg(objectId,total,curr_len,anch,nos)
                            
                    }
                }
                else if(single_flow.event){
                    if(single_flow.event=='scroll'){
                        let targ=single_flow.target
                        let depth=single_flow.depth
                        let obo
                        obo={
                            doAct:'scroll',target:targ,depth:depth
                        }
    
                        let res=await Promise.race([postPer(runTab,obo,runWin,objectId),checkWindows(runWin)])
                        if(res=='missing'){
                         
                            resolve('missing')
                            return
                        } 
                        nos+=1
                        let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                        if(pq=='missing'){
                            resolve('missing')
                            return
                        }
                        updateProg(objectId,total,curr_len,anch,nos)
                    }
                    else if(single_flow.event=='click'){
                        let tmeout=single_flow.timeout?single_flow.timeout:5
                        let targ=single_flow.target
                     
                        let obo
                        obo={
                            doAct:'click',target:targ,stopper,timeout:tmeout
                        }
                        let res=await Promise.race([postPer(runTab,obo,runWin,objectId),checkWindows(runWin)])
                        if(res=='missing'){
                           
                            resolve('missing')
                            return
                        }
                        nos+=1
                        let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                        if(pq=='missing'){
                            resolve('missing')
                            return
                        }
                        updateProg(objectId,total,curr_len,anch,nos) 
                        
                    }
                    else if(single_flow.event=='navigate'){ 
                        nos+=1
                        let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                        if(pq=='missing'){
                            resolve('missing')
                            return
                        }
                        updateProg(objectId,total,curr_len,anch,nos)
                        let yport=await Promise.race([navPort(runTab,single_flow.target),checkWindows(runWin)])
                        if(yport=='missing'){

                            resolve('missing')
                            break
                        }
                        else{
                            nos+=1
                            let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                            if(pq=='missing'){
                                resolve('missing')
                                return
                            }
                            updateProg(objectId,total,curr_len,anch,nos) 
                            fak_flow.shift()
                            let path2=await Promise.race([startFlowing(fak_flow,stopper,runTab,runWin,objectId),checkWindows(runWin)]) 
                            resolve(path2)
                        }  
                        
                    }
                    else if(single_flow.event=='scrape'){
                        nos+=1
                        let values=single_flow.values?single_flow.values:null
                        let list=single_flow.list?{
                            base_target:single_flow.list.row,
                            columns:single_flow.list.columns
                        }:null

                        let destination=single_flow.destination_webhook_url
                        let html=single_flow.save_text
                        let text=single_flow.save_html

                        let pq=await  Promise.race([checkPause(objectId),checkWindows(runWin)])

                        if(pq=='missing'){
                            resolve('missing')
                            return
                        }
                        updateProg(objectId,total,curr_len,anch,nos) 
                        chrome.tabs.sendMessage(runTab,{scrapeAll:true,values,list,destination,html,text,name})

                    }
                }
                
                 
                fak_flow.shift()
            }
            
        }
        // port.disconect()

        resolve(nos)

        
    })
}
const setWidths=(arr)=>{
    let all_Wds=[]
    if(arr.length==0){
    }
    else{
    arr.forEach(item=>{
        let ob={}
        let max
        if(item){
            if(item.flow && item.flows){
               
                ob.min=Math.round(((item.flow-1)/(item.flows))*100)
                ob.max=Math.round((item.flow/(item.flows))*100)
            }
            if(item.flow_pos && item.flow_len){
                let rem=ob.max-ob.min
            
                let small=Math.round((item.flow_pos/item.flow_len)*rem)
                ob.width=ob.min+small
            }
            if(item.sched){
                ob.sched=item.sched
            }
            if(item.act_id){
                ob.act_id=item.act_id
            }
            all_Wds.push(ob) 
        }
        
    })
        
    }
    
    widthObjs=all_Wds

    chrome.storage.local.set({set_widths:all_Wds})
}
let widthObjs=[]
chrome.storage.onChanged.addListener(async(changes,str)=>{
    
    if(changes.action_ids){
        
    }

    if(changes.running_actions){
        let running=changes.running_actions.newValue
        setWidths(running)
        
    }

    if(changes.windows){
        // console.log('New windows',changes.windows.newValue);
    }

   
})