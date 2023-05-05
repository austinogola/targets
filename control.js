
const showUs=()=>{
    console.log('WORKING WONDERS');
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
        let idS=await makeShoWin(act_ob.target_page,act_ob.objectId)
        let runTab=idS[0]
        let runWin=idS[1]
        let allActs=act_ob.actions

        const checkCompletion=()=>{
            return new Promise(async(resolve,reject)=>{
                chrome.tabs.onUpdated.addListener(async function async(tabIdt , info,tab) {
                if (info.status === 'complete') {
                    
                    if(tabIdt==runTab){
                        await sleep(2000)
                        chrome.tabs.query({status:'complete',},(tabs)=>{
                            tabs.forEach(tab=>{
                                if(tab.id==runTab){
                                    console.log('Finished loading',tabIdt);
                                    resolve('LOaded')
                                }
                            })
                        })
                        
                    }
                }
            });
            })
        }

        let comp=await Promise.race([checkCompletion(),checkWindows(runWin)])

        if(comp=='missing'){
            console.log('Cannot find window. Stopping');
            finishProgress(act_ob.objectId)
        }
        else{
            console.log('Running',act_ob);
            lenProg(act_ob.objectId,allActs)
            let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])

            if(pp=='missing'){
                console.log('Window missing. Stopping');
                finishProgress(act_ob.objectId)
                return
            }
            else{
                for(let i=0;i<allActs.length;i++){
                    let showing=allActs[i]
                    
                    let pp=await  Promise.race([checkPause(act_ob.objectId),checkWindows(runWin)])
                    if(pp=='missing'){
                        console.log('Window missing. Stopping');
                        finishProgress(act_ob.objectId)
                        return
                    }else{
                        let subLength=showing.flow.length
                        let repeat=showing.repeat?showing.repeat:1
                        setSubs(act_ob.objectId,subLength*repeat,allActs.length)

                        const maliz=await Promise.race([handleActPart(showing,runTab,runWin,act_ob.objectId),checkWindows(runWin)])
                        if(maliz=='missing'){
                            console.log('maliz',maliz);
                            console.log('Window missing. Stopping');
                            finishProgress(act_ob.objectId)
                            return
                        }
                        else{
                            console.log(maliz);
                        }
                    }
                    
                }
                console.log('FINISHED ACTIONS');
                await sleep(500)
                finishProgress(act_ob.objectId)
                if(act_ob.remove==true){
                    console.log('Removing window');
                    chrome.windows.remove(runWin,()=>{
                        // completeShow(act_ob.objectId)
                    })
                }
                else{
                    console.log('Preserving window');
                    // completeShow(act_ob.objectId)
                }
            }


            
        }
    })
}
}

chrome.storage.local.set({action_ids:[]})
chrome.storage.local.set({running_actions:[]})
chrome.storage.local.set({sched_ids:[]})

const initProg=async(id,sched)=>{
    let action_ids=await chrome.storage.local.get('action_ids')
    let actions=action_ids.action_ids
    actions.push(id)
    chrome.storage.local.set({action_ids:actions})

    let running=await chrome.storage.local.get('running_actions')
    let running_actions=running.running_actions
    let obj={
        act_id:id
    }

    if(sched){
        obj.sched=sched
        let scheds=await chrome.storage.local.get('sched_ids')
        let sched_ids=scheds.sched_ids
        sched_ids.push(sched)
        chrome.storage.local.set({sched_ids:sched_ids})


    }
    else{
       

    }
    running_actions.push(obj)
    chrome.storage.local.set({running_actions:running_actions})

}

const lenProg=async(id,acts)=>{

    let running=await chrome.storage.local.get('running_actions')
    let running_acts=running.running_actions
    if(running_acts && running_acts.length>0){
    let relOb=running_acts.filter(ob=>ob.act_id==id)[0]
    let remOb=running_acts.filter(ob=>ob.act_id!=id)

    let lenn=acts.length+1
    relOb.subs=lenn
    relOb.curr_sub=1

    running_acts=[]
    running_acts.push(relOb)
    running_acts.concat(remOb)

    chrome.storage.local.set({running_actions:running_acts})
}


}


const setSubs=async(id,length,larger)=>{

    let running=await chrome.storage.local.get('running_actions')
    let running_acts=running.running_actions
    if(running_acts && running_acts.length>0){
        let relOb=running_acts.filter(ob=>ob.act_id==id)[0]
        let remOb=running_acts.filter(ob=>ob.act_id!=id)

        if(relOb.curr_sub){
            relOb.curr_sub=relOb.curr_sub+1
        }
        else{
            relOb.curr_sub=2
        }

        if(relOb.subs){
            
        }
        else{
            relOb.subs=larger+1
        }

        relOb.sub_len=length

        relOb.pos=1
        

        running_acts=[]
        running_acts.push(relOb)
        running_acts.concat(remOb)

        chrome.storage.local.set({running_actions:running_acts})
    }
    

}

const handleActPart=(obj,runTab,runWin,objectId)=>{
    // console.log('Tab: ',runTab);
    return new Promise(async(resolve,reject)=>{
        let flow=obj.flow
        let repeat=obj.repeat?obj.repeat:1
        let stopper=obj.stop_if_present?obj.stop_if_present:null
        let timeout=obj.timeout?obj.timeout:5

        let sub_len=flow.length
        

        if(sub_len==0){
            resolve('Done with sub-flow')
        }
        else{

            for(let i=0;i<repeat;i++){ 
                let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                if(pp=='missing'){
                    resolve('missing')
                    return
                }
                
                let tidy=await Promise.race([startFlowing(flow,stopper,runTab,runWin,objectId),checkWindows(runWin)])
                if(tidy){
                    if(tidy=='stop element'){
                        console.log('STOP element! moving on');
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
                }
                else{
                    resolve('closed')
                }

            }

            if(repeat>1){
                
            }
            else{
                let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
                let tidy=await Promise.race([startFlowing(flow,stopper,runTab,objectId),checkWindows(runWin)])
                if(tidy=='stop element'){
                    console.log('STOP element! moving on');
                    resolve('Done with sub-flow')
                }
                else if(tidy=='closed' || tidy=='missing'){
                    resolve('closed')
                }
            }

            resolve('Done with sub-flow')

        }


    })
}

const startFlowing=async(flow,stopper,runTab,runWin,objectId)=>{
    // console.log('Starting flow in tab: ',runTab);
    return new Promise(async(resolve,reject)=>{

        let relTab
        let fak_flow=flow

        let port

        // try {
        //     port=await chrome.tabs.sendMessage(runTab,{startConn:'connect_to_me'})
            
        // } catch (error) {
        //     resolve('closed')
        // }
        for(let m=0;m<flow.length;m++){
            let pp=await  Promise.race([checkPause(objectId),checkWindows(runWin)])
            if(pp=='missing'){
                resolve('missing')
                return
            }

            if(flow[m].wait){
                console.log('Waiting',flow[m].wait,'seconds...');
                await sleep(flow[m].wait*1000)
                console.log('waited');
                updateProg(objectId)
            }

            else if(flow[m].event){
                if(flow[m].event=='scroll'){
                    let target=flow[m].target
                    let depth=flow[m].depth
                    let res=await Promise.race([postPer(runTab,{doAct:'scroll',target,depth},runWin,objectId),checkWindows(runWin)])
                    if(res=='missing'){
                        resolve('missing')
                        return
                    }
                    else{
                        console.log(res);
                        updateProg(objectId) 
                    }
                }
                else if(flow[m].event=='click'){
                    let timeout=flow[m].timeout?flow[m].timeout:5
                    let target=flow[m].target
                    let res=await Promise.race([postPer(runTab,{doAct:'click',target,stopper,timeout},runWin,objectId),checkWindows(runWin)])
                    if(res=='missing'){
                        resolve('missing')
                        return
                    }
                    else{
                        console.log(res);
                        updateProg(objectId) 
                    }

                }
                else if(flow[m].event=='navigate'){ 
                    let yport=await Promise.race([navPort(runTab,flow[m].target),checkWindows(runWin)])
                    if(yport=='missing'){
                        resolve('missing')
                        break
                    }
                    else{
                        console.log(yport);
                        updateProg(objectId) 
                        fak_flow.shift()
                        let path2=await Promise.race([startFlowing(fak_flow,stopper,runTab,runWin,objectId),checkWindows(runWin)]) 
                        resolve(path2)
                    }  
                    
                }   
                
            }
            fak_flow.shift()
        }
        // port.disconect()
        resolve('DONE')

        // chrome.runtime.onConnect.addListener(async(port)=>{
        //     let senderTab
        //     if(port.sender.tab){
        //         senderTab=port.sender.tab.id
        //     }
        //     else{
        //         senderTab=runTab 
        //     }
            
        // })

        
    })
}