chrome.runtime.onMessage.addListener(async(request,sender,sendResponse)=>{
    if(request.beginRun){
        runningId=request.objectId
        handleRun(request.acts)
    }
    if(request.startConn){
        console.log('JUst recei startConn');
        var port = chrome.runtime.connect({name: "ctrl_port"});
        sendResponse(port)
        port.onMessage.addListener(async(message,port)=>{
            if(message.doAct){
                // chrome.runtime.sendMessage({update:`Recived do ${message.doAct}`})
                if(message.doAct=='click'){
                    let res=await performClick(message.target,message.stopper,message.timeout)
                    port.postMessage({feedback:res})
                }
                else if(message.doAct=='scroll'){
                    let res=await performScroll(message.target,message.depth,message.timeout)
                    port.postMessage({feedback:res})
                }
                // let result=await performOne(message.doAct,message.target,message.stopper)
            }
        })
    }
})
chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener(async(message,port)=>{
        if(message.doAct){
            chrome.runtime.sendMessage({update:`Recived do ${message}`})
            if(message.doAct=='click'){
                let res=await performClick(message.target,message.stopper,message.timeout)
                port.postMessage({feedback:res})
            }
            else if(message.doAct=='scroll'){
                let res=await performScroll(message.target,message.depth,message.timeout)
                port.postMessage({feedback:res})
            }
            // let result=await performOne(message.doAct,message.target,message.stopper)
        }
    })
})

let runningId

const performScroll=async(target,depth,timeout)=>{
    // chrome.runtime.sendMessage({update:`RUNNING PRF SCROLL`})
    return new Promise(async(resolve,reject)=>{
        if(target){
            chrome.runtime.sendMessage({update:`searching for ${target}`})
            let el=await Promise.race([loadSelector(target),sleep(timeout*1000)])

            if(el){
                chrome.runtime.sendMessage({update:`found ${target}, scrolling`})
                el.scrollBy({top:depth,behavior:'smooth'})
                resolve('scrolled')
            }
            else{
                chrome.runtime.sendMessage({update:`timeout!Moving on`})
                resolve('timeout')
            }
            
            
        }
        else{
            setTimeout(() => {
                chrome.runtime.sendMessage({update:`scrolling main window`})
                window.scrollBy({top:depth,behavior:'smooth'})  
                // chrome.runtime.sendMessage({progress:1,objectId:runningId})
                resolve(`scrolled`)  
            }, 50);
        } 

    })
}

const performClick=async(target,stopper,timeout)=>{
    // chrome.runtime.sendMessage({update:`RUNNING PRF CLICK`})
    return new Promise(async(resolve,reject)=>{
        if(stopper){
            let stop
            try{
                stop=$(stopper)[0]
            }
            catch{
                stop=null
            }
            if(stop){
                chrome.runtime.sendMessage({update:`stop elemnt found`})
                resolve('stop element')
            }
            
        }
        chrome.runtime.sendMessage({update:`searching for ${target}`})
        let el=await Promise.race([loadSelector(target),sleep(timeout*1000)])

        if(el){
            chrome.runtime.sendMessage({update:`found ${target}, clicking`})
            el.click()
            resolve('clicked')
        }
        else{
            chrome.runtime.sendMessage({update:`timeout!Moving on`})
            resolve('timeout')
        }
        

    })
}
const performOne=async(evt,target,stopper)=>{
    return new Promise(async(resolve,reject)=>{
        if(evt=='scroll'){
            
        }
        if(stopper){
            let stop
            try{
                stop=$(stopper)[0]
            }
            catch{
                stop=null
            }
            if(stop){
                resolve('stop element')
            }
            let el=await Promise.race([loadSelector(obj.target),sleep(timer)])
        }
    })
}


const handleRun=async(arr)=>{
    let remaining=[...arr]

    chrome.runtime.sendMessage({update:`Aray len is ${arr.length}`})

    for(let i=0;i<arr.length;i++){
        if(false){

        }
        else{
            if(arr[i].event){
                remaining.shift()
                chrome.runtime.sendMessage({progress:1,objectId:runningId})
                // chrome.runtime.sendMessage({update:'RUNNING NAVI'})
                let men=await navigateUs(arr[i].target,remaining)
    
            }else if(arr[i].flow){
                remaining.shift()
                // chrome.runtime.sendMessage({update:'RUNNING FLOW'})
                let fin=await runTillEnd(arr[i])
                if(fin=='OFF'){
                    chrome.runtime.sendMessage({progress:'OFF',objectId:runningId})
                    chrome.runtime.sendMessage({update:`App turned OFF`})
                    return
                }
                // chrome.runtime.sendMessage({update:`fake flow ob rem${remaining.length}`})
                
            }
            else if(typeof(arr[i].remove)!=='undefined'){
                let remove=arr[i].remove==true?'1':'0'
                chrome.runtime.sendMessage({update:'RUNNING REMOVE'})
                chrome.runtime.sendMessage({progress:'DONE',objectId:runningId})
                chrome.runtime.sendMessage({update:'FINII PBESS BY 1'})
                chrome.runtime.sendMessage({update:`Actions finished`,remove:remove})
    
            }
        }
          
    }
    
  }


  const runTillEnd=(obj)=>{
    let {repeat,flow,stop_if_present}=obj
    console.log('Running till end',obj);
    console.log('Running this fot',repeat ,'times');


    return new Promise(async(resolve,reject)=>{
        for(let i=0;i<repeat;i++){
            chrome.runtime.sendMessage({update:`REPETITION ${repeat}`})
            for(let j=0;j<flow.length;j++){
                flow[j].stopper=stop_if_present
                let rep=await runTidBit(flow[j])
                if(rep=='OFF'){
                    chrome.runtime.sendMessage({progress:'all'})
                    resolve('OFF')
                }
            }
        }
        resolve('FINISHED SET')
    })
    
  }

  let state

  const navigateUs=(target,rems)=>{
    return new Promise((resolve,reject)=>{
        chrome.runtime.sendMessage({update:`navigating to ${target}`,remaining:rems,target:target,objectId:runningId})
    })
  }

  const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  const runTidBit=async(obj)=>{
    console.log('Runnig tid',obj);
    chrome.runtime.sendMessage({update:`Runnig TidBIT`})
    return new Promise(async(resolve,reject)=>{
        if(state=='OFF'){
            resolve('OFF')
        }
        else{
            if(obj.wait){
                console.log('Sleeping');
                // chrome.runtime.sendMessage({update:`Waiting ${obj.wait} seconds...`})
                await sleep(obj.wait*1000)
                chrome.runtime.sendMessage({update:'SLEPT PBESS BY 1'})
                chrome.runtime.sendMessage({progress:1,objectId:runningId})
                resolve(`performed`)  
            }
            else if(obj.event){
                let stopper
                let timer
                if(obj.stopper){
                    // chrome.runtime.sendMessage({update:`this has a stop sign, checking...`})
                    try{
                        stopper=$(obj.stopper)[0]
                    }
                    catch{
                        // chrome.runtime.sendMessage({update:`Couldn't evaluate stop elemnt`}) 
                        stopper=null
                    }
                }
                if(obj.timeout){
                    timer=1000*obj.timeout
                }else{
                    timer=5000
                }
                
                if(obj.event=='click'){
                    // chrome.runtime.sendMessage({update:`searching ${obj.target}`})
                    let el=await Promise.race([loadSelector(obj.target),sleep(timer)])
                    if(stopper){
                        // chrome.runtime.sendMessage({update:`stop element found, STOPPING`})
                        // chrome.runtime.sendMessage({update:`stop element: ${stopper}`})
                        // chrome.runtime.sendMessage({update:'STOPPER PBESS BY 1'})
                        chrome.runtime.sendMessage({progress:1,objectId:runningId})
                        resolve('stopped') 
                    }else{
                        // chrome.runtime.sendMessage({update:`no stop element ${stopper}, proceeding`})
                        if(el){
                            // chrome.runtime.sendMessage({update:`found,clicking ${obj.target},${el}`})
                            el.click();
                        }
                        else{
                            // chrome.runtime.sendMessage({update:`${timer/1000}s time out! ${obj.target} not found`}) 
                        }
                        chrome.runtime.sendMessage({update:'CLICK/TIME PBESS BY 1'})
                        chrome.runtime.sendMessage({progress:1,objectId:runningId})
                        resolve(`performed`)  
                    }
                    
                    
                }
                else if(obj.event=='scroll'){
                    console.log('scroll event');
                    if(obj.target){
                        // chrome.runtime.sendMessage({update:`searching ${obj.target}`})
                        let el=await Promise.race([loadSelector(obj.target),sleep(timer)])
                        // let el=await loadSelector(obj.target)
                        if(el){
                            let parent=el.parentNode
                            setTimeout(() => {
                                // chrome.runtime.sendMessage({update:`found, scrolling ${obj.target}`})
                                parent.scrollBy({top:obj.depth,behavior:'smooth'})
                                el.scrollBy({top:obj.depth,behavior:'smooth'})
                                chrome.runtime.sendMessage({update:'SCROLLED PBESS BY 1'})
                                chrome.runtime.sendMessage({progress:1,objectId:runningId})
                                resolve(`performed`)   
                                // sendResponse({done:true})
                            }, 50);
                        }
                        else{
                        //    chrome.runtime.sendMessage({update:`${timer/1000}s time out! ${obj.target} not found`}) 
                           chrome.runtime.sendMessage({update:'TIMEOUT PBESS BY 1'}) 
                           chrome.runtime.sendMessage({progress:1,objectId:runningId})
                           resolve(`performed`)  
                        }
                        
                        
                    }else{
                        console.log('To scroll main');
                        setTimeout(() => {
                            console.log('Scrolling',obj.depth);
                            // chrome.runtime.sendMessage({update:`scrolling main window`})
                            window.scrollBy({top:obj.depth,behavior:'smooth'})  
                            // window.scroll(0,obj.depth)
                            chrome.runtime.sendMessage({update:'SCROLLED PBESS BY 1'})
                            chrome.runtime.sendMessage({progress:1,objectId:runningId})
                            resolve(`performed`)  
                            // sendResponse({done:true})
                        }, 50);
                    }
                }
                else if(obj.event=='navigate'){
                        resolve(obj)
                }
            }
        }
        
        
    })
}

const  loadSelector=async(selector,query)=> {
    var raf;
    var found = false;
    let el

    return new Promise((resolve,reject)=>{
        (function check(){
            if(query){
                el=$(selector)[0]

            }else{
                el=$(selector)[0]
            }
            
            if (el) {
                found = true;
                cancelAnimationFrame(raf);
                console.log('Finally found',el);
                resolve(el)
                
                if(!found){
                raf = requestAnimationFrame(check);
                }
                
            
            } else {
                raf = requestAnimationFrame(check);
            }
            })();
    })   
}