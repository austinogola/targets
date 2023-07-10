const sandbox=document.querySelector('.sandbox')

chrome.runtime.onMessage.addListener((message,sender,sendResponse)=>{
    if(message.testy){
        console.log(message);

        let dt={
            name:'Austino',
            age:24,
            gender:'male',
            method:`
                delete obj.age
                return obj
            `
        }

        sandbox.contentWindow.postMessage(dt,'*')

    }

    return true
})

chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener(async(message,port)=>{
        if(port.name=='Scripting port'){
            if(message.process){
                sandbox.contentWindow.postMessage(message,'*') 
            }
        }
    })
})

window.addEventListener('message',evt=>{
    if(evt.data.result){
        let proccessedData=evt.data.result
        var port = chrome.runtime.connect({name: "Scripting port"});
        port.postMessage({result:proccessedData})
    }
})
