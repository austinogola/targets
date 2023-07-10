
chrome.runtime.onConnect.addListener((port)=>{
    port.onMessage.addListener((message,port)=>{
        if(message.completeProgress){
            // compProg(message.completeProgress)
        }
        if(message.updateProgress){
            // addProgr(message.updateProgress)
        }
        if(message.startChanges){
            // initProg(message.startChanges,message.schedule)
        }
        if(message.lenProgress){
            // lenProg(message.lenProgress,message.length)
        }
        if(message.addSub){
            // addSub(message.addSub,message.length)
        }
    })
})

const freePort=chrome.runtime.connect({
    name: "freePort"
});
freePort.onMessage.addListener((msg)=>{
    if(msg.schedules){
        addSchedules(msg.schedules)
    }
    if(msg.act_actions){
        addActions(msg.act_actions)
    }
    if(msg.absent){
        if(msg.absent.length!=0){
            if(msg.absent.includes('state')){
                chrome.runtime.sendMessage({state: state})
            }
            if(msg.absent.includes('userId') && userId){
                chrome.runtime.sendMessage({setId: userId})
            }
            if(msg.absent.includes('taskId') && taskId){
                chrome.runtime.sendMessage({setTask: taskId})
            }
            if(msg.absent.includes('autos') && autos){
                chrome.runtime.sendMessage({autos: autos})
            }
        }
    }
})
// const title=document.querySelector('.statusTitle>p')


const statusColor=document.querySelector('#status-color')
const statusText=document.querySelector('#current-status')

const txt_input=document.querySelector('#text_field')
const user_id_input=document.querySelector('#userId_field')

const newSchedBtn=document.querySelector('#newSchedBtn')
const finalSchedBtn=document.querySelector('#finalSchedBtn')
const cancelBtn=document.querySelector('#cancelBtn')

const tabcontents = document.querySelectorAll(".tabContent");

const tablinks=document.querySelectorAll('.tablinks')

const refreshBtn=document.querySelector('#statusDiv .refreshBtn')

refreshBtn.addEventListener('click',e=>{
    e.preventDefault()
    chrome.runtime.sendMessage({refreshExtension:true})
})


// window.addEventListener('message', (event) => {
//     console.log('EVAL output', event.data);
//  });

//  sandbox.contentWindow.postMessage('10 + 20', '*');

let active_tab=localStorage.getItem('active_tab')


const setWidths=(arr)=>{
    let all_Wds=[]
    if(arr.length==0){
        handleActions()
        handleSchedules()
    }
    else{
        

    arr.forEach(item=>{
        let ob={}
        let max
        if(item){
            if(item.subs && item.curr_sub){
                // max=Math.round((((item.curr_sub)/item.subs) *100))
                // ob.width=Math.round(max*0.7)
                
            }
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

    localStorage.setItem('set_widths',JSON.stringify(all_Wds))

    let all=JSON.parse(localStorage.getItem('allWidths'))

    if(all.length==0){
        localStorage.setItem('set_widths',JSON.stringify([]))
        localStorage.setItem('set_widths',JSON.stringify([]))
    }
    

    

}

widthOrAct=()=>{

}

chrome.storage.onChanged.addListener(async(changes,str)=>{
    const action_items=Array.from(document.querySelectorAll('.action_item'))
    const schedule_items=Array.from(document.querySelectorAll('.schedule_item'))
    const runningAs=Array.from(document.querySelectorAll('.running_action'))
    if(changes.action_ids){
        let actions=changes.action_ids.newValue
        localStorage.setItem('allActs',JSON.stringify(actions))
        if(actions.length>0){
            actions.forEach(item=>{
                let targ=document.querySelector(`[sid="Ac${item}"]`)
                if(targ){
                    actToRun(targ)
                }
            })
        }
        else{
            handleActions()
        }

    }
    if(changes.sched_ids){
        let scheds=changes.sched_ids.newValue
        localStorage.setItem('allScheds',JSON.stringify(scheds))
        if(scheds.length>0){
            scheds.forEach(item=>{
                let targ=document.querySelector(`[sid="Sc${item}"]`)
                if(targ){
                    changeSchedToRun(targ)
                }
            })
        }
        else{
            handleSchedules()
        }
    }

    if(changes.set_widths){
        let setWidths=changes.set_widths.newValue
        localStorage.setItem('popWits',JSON.stringify(setWidths))

        if(setWidths.length>0){
            setWidths.forEach(async item=>{
                let targ=document.querySelector(`[sid="Ac${item.act_id}"]`)
                if(targ){
                    if(targ.getAttribute('class')=='running_action'){
                        changeWidth(targ,item.width)
                    }else{
                        actToRun(targ)
                    } 
                     
                }
                if(item.sched){
                    let targB=document.querySelector(`[sid="Sc${item.sched}"]`) 
                    if(targB){
                        console.log(targB);
                        if(targB.getAttribute('class')=='running_schedule'){
                            changeWidth(targB,item.width)
                        }
                        else{
                            changeSchedToRun(targB)
                        }
                        
                    }
                }
            })
        }
    }
    if(changes.windows){
        let windOOws=changes.windows.newValue
        localStorage.setItem('popupWindows',JSON.stringify(windOOws))
        if(windOOws[0]){
            windOOws.forEach(winAct=>{
                if(winAct.action){
                    let targ=document.querySelector(`[sid="Ac${winAct.action}"]`)
                    targ?actToRun(targ):null
                }
                if(winAct.schedule){
                    let targB=document.querySelector(`[sid="Sc${winAct.schedule}"]`) 
                    targB?changeSchedToRun(targB):null
                }
            })
        }
        // handleActions()
        // handleSchedules()
    }

    if(changes.running_actions){
        let running=changes.running_actions.newValue
        // setWidths(running)
        let action_ids=await chrome.storage.local.get('action_ids')
        let actions=action_ids.action_ids

       
        if(actions.length=0){
            localStorage.setItem('allWidths',JSON.stringify([]))
            handleActions()
        }
        let schedz=await chrome.storage.local.get('sched_ids')

        if(schedz){
            
            let scheds=schedz.sched_ids

            if(scheds && scheds.length>0){
                schedule_items.forEach(item=>{
                    if(scheds.length>0){
                        if(scheds.includes(item.getAttribute('id'))){
                            // changeSchedToRun(item)
                        }
                    }
                    
                })
            }
            if(scheds.length=0){
                localStorage.setItem('allWidths',JSON.stringify([]))
                handleSchedules()
            }

        }
        
    }

})


const initProg=(id,sched)=>{
 
    let idd=id.toString()
    if(localStorage.getItem('just_ids')){
        let actions=JSON.parse(localStorage.getItem('just_ids'))
        actions.push(idd)
        localStorage.setItem('just_ids',JSON.stringify(actions))
    }
    else{
        let actions=[idd]
        localStorage.setItem('just_ids',JSON.stringify(actions))
    }


    if(localStorage.getItem('running_acts')){
        let actions=JSON.parse(localStorage.getItem('running_acts'))

        actions.push({id:idd,sched:sched})
        localStorage.setItem('running_acts',JSON.stringify(actions))
    }
    else{
        let actions=[{id:idd,sched:sched}]
        localStorage.setItem('running_acts',JSON.stringify(actions))
    }

    if(sched){
        if(localStorage.getItem('sched_ids')){
            let actions=JSON.parse(localStorage.getItem('sched_ids'))
    
            actions.push(sched)
            localStorage.setItem('sched_ids',JSON.stringify(actions))
        }
        else{
            let actions=[sched]
            localStorage.setItem('sched_ids',JSON.stringify(actions))
        }

    }
    checkProgress()
}


const lenProg=(id,subs)=>{
    let actions=JSON.parse(localStorage.getItem('running_acts'))
    let relOb=actions.filter(ob=>ob.id==id.toString())[0]
    let remOb=actions.filter(ob=>ob.id!=id.toString())

    if(relOb){
        relOb.subs=subs
        actions=[]
        actions.push(relOb)
        console.log(relOb);
        actions.concat(remOb)

        localStorage.setItem('running_acts',JSON.stringify(actions))
        checkProgress()
    }


}
const compProg=(id)=>{
    console.log('CLEARING ACTION');
    let idd=id.toString()

    if(localStorage.getItem('running_acts')){
        let actions=JSON.parse(localStorage.getItem('running_acts'))
        let relObs=actions.filter(ob=>ob.id==idd)
        if(relObs.sched){
            let scheds=JSON.parse(localStorage.getItem('sched_ids')) 
            let remScheds=scheds.filter(item=>item!=relObs.sched)
            localStorage.setItem('sched_ids',JSON.stringify(remScheds))

        }
        let remObs=actions.filter(ob=>ob.id!=idd)
        localStorage.setItem('running_acts',JSON.stringify(remObs))
    }

    if(localStorage.getItem('just_ids')){
        let actions=JSON.parse(localStorage.getItem('just_ids'))
        if(actions.includes(idd)){
            const index = actions.indexOf(idd);
            actions.splice(index,1)
            localStorage.setItem('just_ids',JSON.stringify(actions))
        }

    }
    handleActions()

}

const moveBar=(target,curr,width)=>{

    let i=0
    if(curr){
        i=curr
    }

    console.log('Current iS ',i,'moving to',width);

    

    const frame=()=>{
        if(i==width){
            clearInterval(mvment)
        }else{
            i++

            target.style.width=`${i}%`
        }
    }

    var mvment= setInterval(frame, 60);
    
}

const addProgr=(id)=>{
    console.log('HHH Progressing Sub');
    let iidd=id.toString()

    let actions=JSON.parse(localStorage.getItem('running_acts'))
    let relOb=actions.filter(ob=>ob.id==iidd)[0]
    let remOb=actions.filter(ob=>ob.id!=iidd)

    if(relOb){

    if(relOb.pos){
        relOb.pos=relOb.pos+1
    }
    else{
        relOb.pos=1
    }


    actions=[]
    actions.push(relOb)
    console.log(relOb);
    actions.concat(remOb)

    localStorage.setItem('running_acts',JSON.stringify(actions))
    // checkProgress()
    handleActions()
}

    // const allActItems=document.querySelectorAll('div.action_item')   
}


const calculateBar=(target)=>{

}

const fetchMeSchedules=()=>{
    return new Promise(async(resolve,reject)=>{
        let savedSchedules=await chrome.storage.local.get('allUserSchedules')
        if(savedSchedules && savedSchedules.allUserSchedules){
            let schedules=savedSchedules.allUserSchedules
            resolve(schedules)
        }
        else{
            var port = chrome.runtime.connect({
                name: "Schedules exchange"
            });
            port.postMessage({fetchSchedules:true});
            port.onMessage.addListener(function(msg) {
                if(msg.schedules){
                    chrome.storage.local.set({allUserSchedules:msg.schedules})
                    resolve(msg.schedules)
                }
            });
        }
    })
}

const fetchMeActions=()=>{
    return new Promise(async(resolve,reject)=>{
        let savedActions=await chrome.storage.local.get('allUserActions')
        if(savedActions && savedActions.allUserActions){
            let actions=savedActions.allUserActions
            resolve(actions)
        }
        else{
            var port = chrome.runtime.connect({
                name: "Actions exchange"
            });
            port.postMessage({fetchActions:true});
            port.onMessage.addListener(function(msg) {
                if(msg.act_actions){
                    chrome.storage.local.set({allUserActions:msg.act_actions})
                    resolve(msg.act_actions)
                }
            });
        }

        
    })
}

const addSchedules=async(arr)=>{
    const mainE=document.querySelector('.schedule_content')
    arr.forEach(async(sched,indx)=>{
        let schedule_item=createElm('div','schedule_item',sched.objectId)
        schedule_item.setAttribute('sid',`Sc${sched.objectId}`)
        if(indx==arr.length-1 && arr.length!=1){
            schedule_item.classList.add('last')
        }

        //Name
        let sched_wrap=createElm('div')
        let sched_name=createElm('span','sched_name')
        sched_name.innerHTML=sched.name
        sched_wrap.appendChild(sched_name)

        //1st half
        let sched_dits=createElm('div','sched_dits')
        let fhalf=createElm('div','fhalf')
        let ev_span=createElm("span","ev_span")
        ev_span.innerHTML=`Every ${sched.period} ${sched.every}${sched.period>1?'s':''}`
        let last_span=createElm("span",'last_span')
        let sched_last=createElm('small','small_run')
        last_span.innerHTML='Last Run: '
        if(sched.lastrun==null || sched.lastrun==undefined){
            sched_last.innerHTML='Never'
        }
        else{
            let timeString=new Date(sched.lastrun).toLocaleString('en-En',{
                weekday: "short", month: "short", day: "numeric",hour:'numeric',hour:'numeric',minute:'numeric'})
            sched_last.innerHTML=` ${timeString}`
        }
        fhalf.appendChild(ev_span)
        fhalf.appendChild(last_span)
        last_span.appendChild(sched_last)
        sched_dits.appendChild(fhalf)

        //2nd half
        let bats=createElm('div','bats')
        const sched_del=document.createElement('button')
        sched_del.setAttribute('class','sched_del')
        sched_del.setAttribute('id',sched.objectId)
        sched_del.innerHTML='Delete'
        bats.appendChild(sched_del)

        const sched_en=document.createElement('button')
        sched_en.setAttribute('class','sched_en')
        sched_en.setAttribute('id',sched.objectId)
        if(sched.enabled){
            sched_en.innerHTML='Enabled'
            sched_en.setAttribute('action_type','disable')

        }
        else{
            sched_en.innerHTML='Disabled'
            sched_en.classList.add("inv")
            sched_en.setAttribute('action_type','enable')
        }
        bats.appendChild(sched_en)

        sched_en.addEventListener("click",async(e)=>{
            e.preventDefault()
            let id=e.target.getAttribute("id")
            let do_action=e.target.getAttribute("action_type")
            if(do_action=='enable'){
                chrome.runtime.sendMessage({updateSchedule:id,updateTo:'play'})
            }
            else if(do_action=='disable'){
                chrome.runtime.sendMessage({updateSchedule:id,updateTo:'pause'})
            }
            await sleep(500)
            handleSchedules()
        })

        sched_del.addEventListener('click',async (e)=>{
            e.preventDefault()
            console.log('Clicked delete button');
            let id=e.target.getAttribute("id")
            chrome.runtime.sendMessage({updateSchedule:id,updateTo:'delete'})
            await sleep(500)
            handleSchedules()
        })

        sched_dits.appendChild(bats)
        sched_wrap.appendChild(sched_dits)

        schedule_item.appendChild(sched_wrap)

        mainE.appendChild(schedule_item)

        let sched_idz=await chrome.storage.local.get('sched_ids')
        let schedz=sched_idz.sched_ids
        
        if(schedz && schedz.length>0){
            if(schedz.includes(sched.objectId)){
                changeSchedToRun(schedule_item)
            }
        }

        


        // if(schedz.includes(sched.objectId)){
        //     
        // }

    })
    // checkProgress()
}

const handleSchedules=async()=>{
    const mainE=document.querySelector('.schedule_content')
    let arr=await fetchMeSchedules()

    while (mainE.firstChild) {
        mainE.removeChild(mainE.firstChild);
      }
      
    if(arr instanceof Array){
        addSchedules(arr)    
    }else{
      mainE.innerHTML=arr
      handleSchedules()
    }

    handleDropDown()
    
}

const sleep=(ms)=> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

const createElm=(type,classname,id)=>{
    let elmt=document.createElement(type)
    if(classname){
        elmt.setAttribute('class',classname)
    }
    if(id){
        elmt.setAttribute('id',id)
    }

    return elmt
}

const calculateWidth=(obj)=>{

}

const calcBar=async(targ)=>{
    console.log('Calcbar running');
    let id=targ.getAttribute('id')
    let progress_bar=targ.querySelector('.progress_bar')
    let relOb
    let actions=JSON.parse(localStorage.getItem('running_acts'))

    relOb=actions.filter(item=>{
        return item.id==id
    })[0]

    remObs=actions.filter(item=>{
        return item.id!=id
    })

    if(relOb){

    }
    else{
        relOb=actions.filter(item=>{
            return item.sched==id
        })[0]

        remObs=actions.filter(item=>{
            return item.sched!=id
        })
    }

    



    if(relOb){
        let curr_width=relOb.width
        let width=2
        
        let largest
        let smaller
        if(relOb.subs){
            if(relOb.curr_sub){
                if(relOb.curr_sub==relOb.subs){
                    largest=90
                }
                else{
                    largest=Math.round((relOb.curr_sub/relOb.subs)*100)
                }
                
            }
        }
        if(relOb.sub_len){
           
            if(relOb.pos){
                let rema=100-largest
                smaller=Math.round((relOb.pos/relOb.sub_len)*rema)
                console.log('smaller',smaller);

            }
        }

        if(largest && smaller){
            width=largest+smaller
            if(width>=100){
                width=99
            }
            console.log('Adjusting progress bar to ',width,'%');
            console.log('Current width is',curr_width,'adjusting to',width);
            // moveBar(progress_bar,curr_width,width)

            relOb.width=width

            actions=[]
            actions.push(relOb)
            actions.concat(remObs)

            localStorage.setItem('running_acts',JSON.stringify(actions))

            while(curr_width!=width){
                progress_bar.style.width=`${curr_width}%`
                curr_width+=1
                await sleep(50)
            }

            // const frame=(curr_width,width)=>{
            //     let us=curr_width
            //     if(curr_width==width){
            //         clearInterval(mvment)
            //     }else{
            //         console.log('AUSTO TO ',curr_width);
            //         progress_bar.style.width=`${curr_width}%`
            //         curr_width+=1
        
            //     }
            // }

            // var mvment= setInterval(frame(curr_width,width), 60);
        
        }


        
        // if(relOb.curr && relOb.len){
            
        //     let width=Math.round((relOb.curr/relOb.len)*100)
        //     console.log('Adjusting progress bar to ',width,'%');
        //     progress_bar.style.width=`${width}%`
        //     // console.log(progress_bar.style.width);
        // } 
        // else{
        //     console.log('Insufficient values for calc');
        // }
    }
    
    else{
        console.log('NOT FOUND FOR CALS');

    }




    // if(relOb){

    //     if(relOb.curr && relOb.len){
            
    //         let width=Math.round((relOb.curr/relOb.len)*100)
    //         console.log('Adjusting progress bar to ',width,'%');
    //         progress_bar.style.width=`${width}%`
    //         // console.log(progress_bar.style.width);
    //     } 
    //     else{
    //         console.log('Insufficient values for calc');
    //     }
    // }
    // else{
    //     console.log('NOT FOUND FOR CALS');
    // }

}

const addToPause=(id,toPause,schedule)=>{
    if(toPause){
        if(schedule){
            freePort.postMessage({pauseThis:id,shed:true})
        }
        else{
            freePort.postMessage({pauseThis:id})
        }
        
    }
    else{
        if(schedule){
            freePort.postMessage({playThis:id,shed:true})
        }
        else{
            freePort.postMessage({playThis:id})
        }
    }

}

const changeSchedToRun=async(target,width)=>{

    let id=target.getAttribute("id")
    target.setAttribute('class','running_schedule')

    let sc_name=target.querySelector(".sched_name").innerHTML
    let runn_ev=target.querySelector(".ev_span").innerHTML

    while(target.firstChild){
        
        target.removeChild(target.firstChild)
    }
    let act_id
    

    let running_name=createElm('span','sched_name')
    running_name.innerHTML=sc_name
    target.appendChild(running_name)
    
    

    // let running_every=createElm('span','running_every')
    let running_every=createElm('span','ev_span')
    // let schedules=await fetchMeSchedules()
    // let relSched=schedules.filter(sched=>sched.objectId==id)[0]
    running_every.innerHTML=runn_ev
    target.appendChild(running_every)

    let run_show=createElm('span','run_show')
    run_show.innerHTML='Running'
    target.appendChild(run_show)
    
    let paused
    let showers=createElm('div','showers')
    //Prog bar
    let progress_outline=createElm('span','progress_outline')
    let progress_bar=createElm('span','progress_bar')
    if(localStorage.getItem('popWits')){
        let popWits=JSON.parse(localStorage.getItem('popWits'))

        let set=popWits.filter(item=>item.sched==id)[0]
        if(set){
            progress_bar.style.width=`${set.width}%` 
        }
    }
    progress_outline.appendChild(progress_bar)
    showers.appendChild(progress_outline)
    

    //icons
    let sched_icons=createElm('span','sched_icons')
    let pause_play=createElm('img')


    if(localStorage.getItem('popupWindows')){
        let popupWindows=JSON.parse(localStorage.getItem('popupWindows'))
        relWin=popupWindows.filter(item=>item.schedule==id)[0]
        if(relWin && relWin.paused){
            paused=true
            run_show.innerHTML=relWin.paused
        }
        if(relWin && relWin.stopping){
            run_show.innerHTML='Stopping'
        }
    }

    if(paused){
        pause_play.setAttribute('src','/icons/play_icon.png')
        
    }
    else{
        pause_play.setAttribute('src','/icons/pause_icon.png')
    }

    pause_play.addEventListener('click',e=>{
        if(e.target.getAttribute('src')=='/icons/pause_icon.png'){
            //pausing
            e.target.setAttribute('src','/icons/play_icon.png')
            addToPause(id,true,'schedule')

        }
        else if(e.target.getAttribute('src')=='/icons/play_icon.png'){
            //playing
            e.target.setAttribute('src','/icons/pause_icon.png')
            addToPause(id,false,'schedule')
        }
        

    })
   
    sched_icons.appendChild(pause_play)

    let stop=createElm('img')
    stop.setAttribute('src','/icons/times_icon.png')
    stop.addEventListener('click',async e=>{
        chrome.runtime.sendMessage({finalize:id,sched:true})

    })
    sched_icons.appendChild(stop)
    showers.appendChild(sched_icons)
    target.appendChild(showers)
    return

    // calcBar(target)



}

chrome.storage.onChanged.addListener(async(changes,str)=>{
    
    if(changes.action_ids){
        
    }

    if(changes.running_actions){
        let running=changes.running_actions.newValue
        // setWidths(running)
        
    }

   
})
const changeWidth=(target,width)=>{
    let pb=target.querySelector(".progress_bar")
    if(width){
        pb.style.width=`${width}%`
    }
}

const actToRun=async(item)=>{
        
    let id=item.getAttribute('id')
    // id=id.splice(0,2)
    // item.classList.add('running_action')
    item.setAttribute('class','running_action')

    let name=item.querySelector(".action_name").innerHTML

    while(item.firstChild){

        item.removeChild(item.firstChild)
    }
    let action_name=createElm('span','action_name')
    action_name.innerHTML=name
    let pHold=createElm('div','pHold')
    pHold.appendChild(action_name)


    let running_show=createElm('span','running_show')
    running_show.innerHTML='Running'
    pHold.appendChild(running_show)

    item.appendChild(pHold)

    //Progress bar
    let paused
    let action_controls=createElm('div','action_controls')
    let progress_outline=createElm('div','progress_outline')
    let progress_bar=createElm('div','progress_bar')
    
    
    progress_outline.appendChild(progress_bar)
    action_controls.appendChild(progress_outline)

    //Icons
    let action_icons=createElm('div','action_icons')
    let pause_play=createElm("img")
    if(localStorage.getItem('popWits')){
        let popWits=JSON.parse(localStorage.getItem('popWits'))

        let set=popWits.filter(item=>item.act_id==id)[0]
        if(set){
            progress_bar.style.width=`${set.width}%`
            
        }
    }
   

    
    if(localStorage.getItem('popupWindows')){
        let popupWindows=JSON.parse(localStorage.getItem('popupWindows'))
        relWin=popupWindows.filter(item=>item.action==id)[0]
        if(relWin && relWin.paused){
            paused=true
            running_show.innerHTML=relWin.paused
        }
        if(relWin && relWin.stopping){
            running_show.innerHTML='Stopping'
        }
    }


    if(paused){
        pause_play.setAttribute('src','/icons/play_icon.png')
    }
    else{
        pause_play.setAttribute('src','/icons/pause_icon.png')
    }


    
    
    pause_play.addEventListener('click',e=>{
        if(e.target.getAttribute('src')=='/icons/pause_icon.png'){
            //pausing
            e.target.setAttribute('src','/icons/play_icon.png')
            addToPause(id,true)

        }
        else if(e.target.getAttribute('src')=='/icons/play_icon.png'){
            //playing
            e.target.setAttribute('src','/icons/pause_icon.png')
            addToPause(id,false)
        }
        
        })

    let stop=createElm("img")
    stop.setAttribute('src','/icons/times_icon.png')
    stop.addEventListener('click',async e=>{
        chrome.runtime.sendMessage({finalize:id})

    })

    action_icons.appendChild(pause_play)
    action_icons.appendChild(stop)
    action_controls.appendChild(action_icons)

    item.appendChild(action_controls)
}


const checkProgress=()=>{
    const action_items=Array.from(document.querySelectorAll('.action_item'))
    const schedule_items=Array.from(document.querySelectorAll('.schedule_item'))

    const running_action_items=Array.from(document.querySelectorAll('.running_action'))

    action_items.concat(running_action_items)

    if(localStorage.getItem('just_ids')){
        let actions=JSON.parse(localStorage.getItem('just_ids'))
        action_items.forEach(item=>{
            console.log(item.getAttribute('id'));
            if(actions.includes(item.getAttribute('id'))){
                let relOb=JSON.parse(localStorage.getItem('running_acts')).filter(obo=>obo.id==item.getAttribute('id'))[0]
                let width=relOb.width
                changeActToRun(item,width)
            }
        })

    }

    if(localStorage.getItem('sched_ids')){
        let scheds=JSON.parse(localStorage.getItem('just_ids'))
        schedule_items.forEach(item=>{
            if(scheds.includes(item.getAttribute('id'))){
                let relOb=JSON.parse(localStorage.getItem('running_acts')).filter(obo=>obo.sched==item.getAttribute('id'))[0]
                let width=relOb.width
                changeActToRun(item,width)
            }
        })

    }
}

const addActions=async(arr)=>{
    let action_content=document.querySelector('.action-content')
    arr.forEach(async(act,indx)=>{
        let action_item=createElm('div','action_item',act.objectId)
        action_item.setAttribute('sid',`Ac${act.objectId}`)
        if(indx==arr.length-1 && arr.length!=1){
            action_item.classList.add('last')
        }

        //First part of item
        const act_holder=createElm('div','act_holder')
        let action_name=createElm('p','action_name')
        action_name.innerHTML=act.name
        act_holder.appendChild(action_name)

        let runActBtn=createElm('button',null,act.objectId)
        runActBtn.innerHTML='Run'
        runActBtn.addEventListener('click',e=>{
            e.preventDefault()
            chrome.runtime.sendMessage({runOne:e.target.id})
        })
        act_holder.appendChild(runActBtn)


        action_item.appendChild(act_holder)


        action_content.appendChild(action_item)

        let action_ids=await chrome.storage.local.get('action_ids')
        let actions=action_ids.action_ids

        if(actions.includes(act.objectId)){
            actToRun(action_item)
        }

        //  showProgress()
        // checkProgress()
    })
}

const fetchMeAutos=()=>{
    return new Promise(async(resolve,reject)=>{
        let savedAutos=await chrome.storage.local.get('allUserAutos')
        if(savedAutos && savedAutos.allUserAutos){
            let autos=savedAutos.allUserAutos
            resolve(autos)
        }
        else{
            var port = chrome.runtime.connect({
                name: "Actions exchange"
            });
            port.postMessage({fetchAutos:true});
            port.onMessage.addListener(function(msg) {
                if(msg.auto_actions){
                    chrome.storage.local.set({allUserAutos:msg.auto_actions})
                    resolve(msg.auto_actions)
                }
            });
        }
    })
}

const addAutos=(arr)=>{
    let autos=document.querySelector(".autos")

    while(autos.querySelector('.autos_item')){
        autos.removeChild(autos.querySelector('.autos_item'))
    }

    arr.forEach(item=>{
        let autos_item=createElm('div','autos_item')
        let name=createElm('p')
        name.innerHTML=item.name
        autos_item.appendChild(name)
        let sp=createElm('span')
        sp.innerHTML=item.completed?'true':'false'
        autos_item.appendChild(sp)
        autos.appendChild(autos_item)
    })

    
}
const handleAutos=async()=>{
    let autos_content=document.querySelector(".autos_content")
    let arr=await fetchMeAutos()
    if(arr instanceof Array){
        addAutos(arr)
    }
    else{
        autos_content.innerHTML=arr
    }
}

const handleActions=async()=>{
    
    let arr=await fetchMeActions()
    
    let action_content=document.querySelector('.action-content')

    while (action_content.firstChild) {
        action_content.removeChild(action_content.firstChild);
      }

    if(arr instanceof Array){
        addActions(arr)
    }
    else{
        action_content.innerHTML=arr
    }

}



const fetchAndSet=(tab)=>{
    if(tab=="schedules"){
        handleSchedules();

    }
    else if(tab=="actions"){
        handleActions()
    }
    else if(tab=='autos'){
        handleAutos()
    }
}

if(active_tab){
    tablinks.forEach(item=>{
        item.classList.remove('active')
        if(item.innerHTML.toLocaleLowerCase()==active_tab){
            item.classList.add('active')
        }
    })
    tabcontents.forEach(item=>{
        item.classList.remove('active')
        if(item.id.toLocaleLowerCase()==active_tab){
            item.classList.add('active')
        }
    })

    if(active_tab=='schedules' || active_tab=='actions'){
        const statusDiv=document.querySelector('#statusDiv')
        statusDiv.style.display='none'
        fetchAndSet(active_tab)
    }
    else if(active_tab=='autos'){
        fetchAndSet(active_tab)
    }
    else{
        const statusDiv=document.querySelector('#statusDiv')
        statusDiv.style.display='block'
    }
    
}



newSchedBtn.addEventListener('click',e=>{
    e.preventDefault()
    let origi=document.querySelector('.schedule_origi')
    let create=document.querySelector('.schedule_create')

    if(origi.style.display=='none'){
        origi.style.display='block'
        create.style.display='none'
    }else{
        origi.style.display='none'
        create.style.display='block'

        // handleDropDown()
    }

})

const every_input=document.querySelector('#every_input>input')

every_input.addEventListener('change',e=>{
    if(parseInt(e.target.value)<1){
        e.target.value=1
    }
})

const handleDropDown=async()=>{


    let arr2=await fetchMeActions()

    const actions_dropdown=document.querySelector('#actions_dropdown')
    const schedules_dropdown=document.querySelector('#schedules_dropdown')
    const new_sched_name=document.querySelector('#new_sched_name>input')

    while (actions_dropdown.firstChild) {
        actions_dropdown.removeChild(actions_dropdown.firstChild);
    }

    if(arr2 instanceof Array){
        arr2.forEach((item,indx)=>{
            const option=document.createElement('option')
            option.setAttribute('value',item.objectId)
            option.setAttribute('class','act_options')
            option.innerHTML=item.name
    
            if(indx==0){
                option.setAttribute('selected','selected')
                // new_sched_name.value=item.name +'(copy)'
            }
    
            actions_dropdown.appendChild(option)
            
        })
        
    }
    else{
        actions_dropdown.innerHTML=arr2
    }


}

const createSchedule=(every,period,actionId,initStatus,sched_name)=>{
    chrome.runtime.sendMessage({
        makeOne:true,
        period:period,
        every:every,
        actionId:actionId,
        initStatus:initStatus,
        sched_name:sched_name
    })

}

finalSchedBtn.addEventListener('click',async(e)=>{
    e.preventDefault()
    let origi=document.querySelector('.schedule_origi')
    let create=document.querySelector('.schedule_create')

    const actions_dropdown=document.querySelector('#actions_dropdown')

    const details_every=document.querySelector('#time_dropdown')
    const details_period=document.querySelector('#schedules_dropdown')

    const details_status=document.querySelector('#details_status select')

    let sched_name=document.querySelector('#new_sched_name>input').value

    let period=document.querySelector('#every_input>input').value
    let every=document.querySelector('#interval_dropdown').value
    let actionId=document.querySelector('#actions_dropdown').value
    let initStatus=document.querySelector('select#status_dropdown').value

    if(!period || parseInt(period)<1){
        period=1
    }

    createSchedule(every,period,actionId,initStatus,sched_name)

    if(origi.style.display=='none'){
        origi.style.display='block'
        create.style.display='none'
    }else{
        origi.style.display='none'
        create.style.display='block'
    }

    await sleep(500)

    handleSchedules()

})


cancelBtn.addEventListener('click',e=>{
 
    e.preventDefault()
    let origi=document.querySelector('.schedule_origi')
    let create=document.querySelector('.schedule_create')
    if(origi.style.display=='none'){
        origi.style.display='block'
        create.style.display='none'
    }else{
        origi.style.display='none'
        create.style.display='block'
    }

})



tablinks.forEach(item=>{
    item.addEventListener('click',e=>{
        tablinks.forEach(item=>{
            item.classList.remove('active')
        })

        e.target.classList.add('active')

        let idn=e.target.innerHTML.toLowerCase()

        tabcontents.forEach(item=>{
            item.style.display='none'
            if(item.id==idn){
                item.style.display='block'
                localStorage.setItem('active_tab',idn)
            }
        })

        if(idn=='schedules' || idn=='actions'){
            const statusDiv=document.querySelector('#statusDiv')
            statusDiv.style.display='none'

            fetchAndSet(idn)
        }
        else{
            const statusDiv=document.querySelector('#statusDiv')
            statusDiv.style.display='block'
        }

    })
})