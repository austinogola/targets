chrome.runtime.onMessage.addListener(async(request,sender,sendResponse)=>{
    if(request.beginRun){
        handleRun(request.acts)
    }
})


const handleRun=async(arr)=>{
    let remaining=[...arr]

    for(let i=0;i<arr.length;i++){
        if(remaining.length==100){

        }
        else{
            if(arr[i].event){
                
                remaining.shift()
                let men=await navigateUs(arr[i].target,remaining)
                console.log('Should navigate');
    
            }else if(arr[i].flow){
                remaining.shift()
                let fin=await runTillEnd(arr[i])
                if(fin=='OFF'){
                    chrome.runtime.sendMessage({update:`App turned OFF`})
                    return
                }
                // chrome.runtime.sendMessage({update:`fake flow ob rem${remaining.length}`})
                
            }
            else if(typeof(arr[i].remove)!=='undefined'){
                let remove=arr[i].remove==true?'1':'0'
                chrome.runtime.sendMessage({update:`Actions finished`,remove:remove})
    
            }
        }
          
    }
    
  }


  const runTillEnd=(obj)=>{
    let {repeat,flow,stop_if_present}=obj
    console.log('Running till end',obj);

    return new Promise(async(resolve,reject)=>{
        for(let i=0;i<repeat;i++){
            for(let j=0;j<flow.length;j++){
                flow[j].stopper=stop_if_present
                let rep=await runTidBit(flow[j])
                if(rep=='OFF'){
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
        chrome.runtime.sendMessage({update:`navigating to ${target}`,remaining:rems,target:target})
    })
  }

  const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }


  const runTidBit=async(obj)=>{
    console.log('Runnig tid',obj);
    return new Promise(async(resolve,reject)=>{
        if(state=='OFF'){
            resolve('OFF')
        }
        else{
            if(obj.wait){
                console.log('Sleeping');
                chrome.runtime.sendMessage({update:`Waiting ${obj.wait} seconds...`})
                await sleep(obj.wait*1000)
                resolve(`performed`)  
            }
            else if(obj.event){
                let stopper
                if(obj.stopper){
                    chrome.runtime.sendMessage({update:`this has a stop sign, checking...`})
                    try{
                        stopper=$(obj.stopper)[0]
                    }
                    catch{
                        chrome.runtime.sendMessage({update:`Couldn't evaluate stop elemnt`}) 
                        stopper=null
                    }
                }
                
                if(obj.event=='click'){
                    chrome.runtime.sendMessage({update:`searching ${obj.target}`})
                    let el=await loadSelector(obj.target)
                    if(stopper){
                        chrome.runtime.sendMessage({update:`stop element found, STOPPING`})
                        chrome.runtime.sendMessage({update:`stop element: ${stopper}`})
                        resolve('stopped') 
                    }else{
                        chrome.runtime.sendMessage({update:`stop element absent, proceeding`})
                        chrome.runtime.sendMessage({update:`stop element: ${stopper}`})
                        chrome.runtime.sendMessage({update:`found,clicking ${obj.target}`})
                        console.log('clicking');
                        el.click();
                        resolve(`performed`)  
                    }
                    
                    
                }
                else if(obj.event=='scroll'){
                    console.log('scroll event');
                    if(obj.target){
                        chrome.runtime.sendMessage({update:`searching ${obj.target}`})
                        let el=await loadSelector(obj.target)
                        let parent=el.parentNode
                        // let grand=parent.parentNode
                        // let child=el.firstChild
                        // let granCh=child.firstChild
                        setTimeout(() => {
                            chrome.runtime.sendMessage({update:`found, scrolling ${obj.target}`})
                            parent.scrollBy({top:obj.depth,behavior:'smooth'})
                            el.scrollBy({top:obj.depth,behavior:'smooth'})
                            resolve(`performed`)   
                            // sendResponse({done:true})
                        }, 50);
                        
                    }else{
                        console.log('To scroll main');
                        setTimeout(() => {
                            console.log('Scrolling',obj.depth);
                            chrome.runtime.sendMessage({update:`scrolling main window`})
                            window.scrollBy({top:obj.depth,behavior:'smooth'})  
                            // window.scroll(0,obj.depth) 
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