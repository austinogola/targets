const newRulesListener=(rules_arr)=>{
    return new Promise((resolve,reject)=>{
        req_ids=[]

        
        rules_arr.forEach(rule=>{
            
        })
        for(let rule of rules_arr){
            // console.log(rule.target_page_url,'------',rule.target_page_url.replaceAll('\\',''),'------',rule.target_page_url.replaceAll('\\','').replaceAll('/','\\/'));
            let formattedPageUrl=rule.target_page_url.replaceAll('\\\\','\\')
            let formattedRequestUrl=rule.target_request_url.replaceAll('\\\\','\\')
            target_page_urls.push(formattedPageUrl)
            target_request_urls.push(formattedRequestUrl)

            let ruleObj={id:rule.objectId,
                currentTrigger:0,
                lastTriggered:0,
                timesNotTriggered:0,
                targetPage:formattedPageUrl,
                targetUrl:formattedRequestUrl,
                label:rule.rule_label,
                destination:rule.destination_webhook_url,
                script:rule.script
            }
            rulesArray.push(ruleObj)
            chrome.storage.local.set({rules:rulesArray}) 
        }

        chrome.webRequest.onBeforeSendHeaders.addListener((n)=>{
            // console.log(n);
            if(false){

            }else{
                if(n.initiator){
                    if(n.initiator.includes('chrome-extension')){
                    
                }
                else{
                    reqHeaders=n.requestHeaders
                    let pageRelevant=false
                    
                    let referer = n.requestHeaders.find(u => u.name.toLowerCase() === "referer")
                    if(referer){
                        referer=referer.value
                        let refererMatches=false
                        let requestMatches=false
                        // let ourReg=new RegExp(/https:\/\/www.linkedin.com\/sales-api\/salesApiNotifications\?count=50&groupType=LEAD.*/)

                        for(let item of target_page_urls){
                            let regEx
                            try{
                                regEx=new RegExp(item)
                            }
                            catch{
                                console.log("Invalid regex",item);
                            }
                            if(regEx && regEx.test(referer)){
                                refererMatches=true
                                break
                            }
                        }

                        if(refererMatches){
                            for(let item of target_request_urls){
                                let regEx2
                                try{
                                    regEx2=new RegExp(item)
                                }
                                catch{
                                    console.log("Invalid regex",item);
                                }
                                if(regEx2 && regEx2.test(n.url)){
                                    requestMatches=true
                                    break
                                }
                               
                                
                            }
                        }

                        if(refererMatches){
                            if(requestMatches){
                                let relevantRule={}
                                rulesArray=rulesArray.filter(rule=>{
                                    let pageRegex=new RegExp(rule.targetPage)
                                    let urlRegex=new RegExp(rule.targetUrl)
                                    if(urlRegex.test(n.url) && pageRegex.test(referer)){
                                        rule.currentTrigger+=1
                                        relevantRule=rule
                                        return rule
                                    }
                                    else{
                                        return rule
                                    }
                                })
                                duplicateRequest(n,relevantRule,referer)

                                chrome.storage.local.set({rules:rulesArray}) 
                            }
                            
                            

                        }

                    }
                    
                    

        
                }
            }
            }   
            },{urls:[`<all_urls>`]},["requestHeaders","extraHeaders"])
    })
}

const duplicateRequest=(requestDetails,rule,origin_page)=>{
    let {url,method,requestId,requestHeaders}=requestDetails
    let{destination,label,script}=rule
    if(req_ids.includes(requestId)){
       
    }
    else{
        req_ids.push(requestId)
        // console.log('Found valid (GET)',url)
        let heads={}
        requestHeaders.forEach(val=>{
            heads[val.name]=val.value
        })

    
         fetch(url,{
        method:method,
        headers:heads
        })
        .then(async res=>{
            if(res.status==200){
                let resBody=await res.json()
                sendResBody(resBody,url,destination,label,'GET',origin_page,script)

            }else{
                // console.log(`Error duplicating (GET) ${url} `);
            }

        })
        .catch(err=>{
            if(false){
                console.log(err);
            }
        })


    }
   
}

const processData=(data,script)=>{
    return new Promise((resolve,reject)=>{
        let randomTab
        // chrome.tabs.query({},tabs=>{
        //     randomTab=tabs[0]
        //     chrome.tabs.sendMessage(randomTab.id,{you:true})
        // })
        chrome.runtime.onConnect.addListener((port)=>{
            port.onMessage.addListener(async(message,port)=>{
                if(port.name=='Scripting port'){
                    if(message.result){
                        resolve(message.result)
                    }
                }
            })
        })
        var port = chrome.runtime.connect({name: "Scripting port"});
        port.postMessage({process:true,data,script})
    })
}

const sendResBody=async(result,url,destination,label,method,origin_page,script)=>{

    let data={}
    for (const [key, value] of Object.entries(result)) {
        data[key]=value
      }
    let body={...data}
    let processedData={}
    if(script){
        processedData=await processData(data,script)

    }
    if(script && processedData.scriptStatus){
        body={...data,...processedData}
    }else{
        body={...data}
    }

    fetch(destination+'?'+new URLSearchParams({
        user:userId,
        task:taskId,
        label:label,
        target_page:origin_page,
        target_url:url
    }),{
        method:'POST',
        headers:{'Content-Type':'application/json'},
        body:JSON.stringify(body)
    })
    .catch(err=>{
        console.log("Couldn't send respond body to",destination);
    })

}