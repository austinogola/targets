window.addEventListener('message',e=>{
    let dataToProcess=e.data.data
    let script=e.data.script
    script='try{'+script+'}catch(err){return ({scriptStatus:{status:"failed",reason:err.message}})}'

    // let method=e.data.method
    let tempFunc=new Function('json',script)
    let result=tempFunc(dataToProcess)
    console.log(result);
    
    e.source.postMessage({result},e.origin)


})