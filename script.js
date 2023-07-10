chrome.runtime.onMessage.addListener(async(request,sender,sendResponse)=>{
    if(request.beginRun){
        runningId=request.objectId
        handleRun(request.acts)
    }
    if(request.scrapeAll){
        if(request.process){
            if(!handledPs.includes(request.process)){
                startScrape(request)
                handledPs.push(request.process)
            }
        }else{
            startScrape(request) 
        }
        
    }
    if(request.startConn){
        var port = chrome.runtime.connect({name: "ctrl_port"});
        sendResponse(port)
        port.onMessage.addListener(async(message,port)=>{
            if(message.doAct){
                
                if(message.doAct=='click'){
                    let res=await performClick(message.target,message.stopper,message.timeout)
                    port.postMessage({feedback:res})
                }
                else if(message.doAct=='scroll'){
                    let res=await performScroll(message.target,message.depth,message.timeout)
                    port.postMessage({feedback:res})
                }
            
            }
        })
    }
})

chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener(async(message,port)=>{
        if(message.doAct){
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

const extractThis=(targ,target)=>{
    if(targ.extract=='text'){
        let text=target.innerText
        return(text);
    }
    else if(targ.extract=='url'){
        let href=target.getAttribute('href')
        return(href);
    }
    else if(targ.extract=='url'){
        let href=target.getAttribute('href')
        return(href);
    }
    else if(targ.extract=='image_url'){
        let src=target.getAttribute('src')
        return(src);
    }
    else if(targ.extract=='html'){
        if(target){
            let parent=target.parentNode
            // let htm=parent.innerHTML
            let htm=target.outerHTML
            return(htm)
        }
        else{
            return(null)
        }
        
    }
    else if(targ.extract=='other'){
        let attr=target.getAttribute(targ.extract_other)
        return(attr);
    }
}

let handledPs=[]

const startScrape=async(obj)=>{
    let finalScrape={
        values:{},
        list:[]
    }
    let {name}=obj

    let htmlTxt
    let extractedHtml

    obj.message='true'
    // chrome.runtime.sendMessage(obj)

    if(obj.values){
        let vals=obj.values
        
        for(let i=0;i<vals.length;i++){
            
            let target=await Promise.race([loadSelector(vals[i].target),sleep(2000)])
            if(target){
                let value=extractThis(vals[i],target)
                let ob={}
                // ob[vals[i].name]=value
                finalScrape.values[vals[i].name]=value
            }
            
        }
    }

    if(obj.list){
        
       let parents=document.querySelectorAll(obj.list.base_target)

       if(parents[0]){
        parents.forEach(async (mzazi,index)=>{
           
            let ob={}
            
            ob.row=index+1
            obj.list.columns.forEach(async col=>{
                let mini=mzazi.querySelector(col.target)
                let value=extractThis(col,mini)
                ob[col.name]=value
           })
           finalScrape.list.push(ob)

        })


       }
    }

    const entirePageHTML = document.documentElement.outerHTML;

    if(obj.html){
        // chrome.runtime.sendMessage({message:'html is true'})
        extractedHtml=entirePageHTML
    }
    if(obj.text){
        const tempDiv = document.createElement("div");
        tempDiv.innerHTML = entirePageHTML;
        if(tempDiv.textContent || tempDiv.innerText){
            htmlTxt+=`${tempDiv.textContent || tempDiv.innerText}`
        }
        // chrome.runtime.sendMessage({message:'text is true'})
    }

    chrome.runtime.sendMessage({scraped:true,data:finalScrape,destination:obj.destination,html:extractedHtml,text:htmlTxt,name})
}

const performScroll=async(target,depth,timeout)=>{
    // chrome.runtime.sendMessage({update:`RUNNING PRF SCROLL`})
    return new Promise(async(resolve,reject)=>{
        if(target){
            // chrome.runtime.sendMessage({update:`searching for ${target}`})
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
                // chrome.runtime.sendMessage({update:`scrolling main window`})
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
                // chrome.runtime.sendMessage({update:`stop elemnt found`})
                resolve('stop element')
            }
            
        }
        // chrome.runtime.sendMessage({update:`searching for ${target}`})
        let el=await Promise.race([loadSelector(target),sleep(timeout*1000)])

        if(el){
            // chrome.runtime.sendMessage({update:`found ${target}, clicking`})
            el.click()
            resolve('clicked')
        }
        else{
            // chrome.runtime.sendMessage({update:`timeout!Moving on`})
            resolve('timeout')
        }
        

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