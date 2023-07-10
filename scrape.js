
const scrapeSignal=async(dets,values,list,destination,html,text,name)=>{
    if(dets.frameType){
        if(dets.frameType=='outermost_frame'){
            let trial=5
            let sent=false
            while(trial>0 && !sent){
                try {
                    chrome.tabs.sendMessage(dets.tabId,
                        {scrapeAll:true,values,list,process:dets.processId,destination,html,text,name},
                        function ignore_error() { void chrome.runtime.lastError; }
                        )
                    // console.log('sent');
                    sent=true
                    // console.log('values--',values,'list--',list);
                    
                } catch (error) {
                    console.log(error.message);
                    console.log('Retrying...');
                    trial+=1
                    await sleep(300)
                }
            }
        }
        return
    }
}

const handleScrapes=async()=>{
    let scrArray=await getScrapes()

    scrArray.forEach(obj=>{
        let target=new URL(obj.target_page_url)
        let docIds=[]
        let allDets=[]
        let pIds=[]
        let values=obj.values?obj.values:null
        let list=obj.list?{
            base_target:obj.list.row,
            columns:obj.list.columns
        }:null
        let name=obj.label
        let destination=obj.destination_webhook_url
        chrome.webNavigation.onCompleted.addListener(async(dets)=>{
            if(dets.url.match(obj.target_page_url)){
                // console.log('This matches',dets.url);
                if(obj.enabled){

                    scrapeSignal(dets,values,list,destination,obj.save_html,obj.save_text,name)
                }
            }
            return
            
        })
    })
}
