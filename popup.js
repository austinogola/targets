const toggler=document.querySelector('#toggler')
const title=document.querySelector('.statusTitle>p')

const statusColor=document.querySelector('#status-color')
const statusText=document.querySelector('#current-status')

const form=document.querySelector('form')
const txt_input=document.querySelector('#text_field')
const user_id_input=document.querySelector('#userId')

const newSchedBtn=document.querySelector('#newSchedBtn')
const finalSchedBtn=document.querySelector('#finalSchedBtn')
const cancelBtn=document.querySelector('#cancelBtn')

let tablinks=document.querySelectorAll('.tablinks')

let state,taskId,userId

toggler.addEventListener('click',e=>{
  
    if (e.target.checked){
        title.innerHTML='Connected'
        localStorage.setItem('Ext_state','ON')
        chrome.runtime.sendMessage({state: 'ON'})
        statusText.innerText='Connected'
        statusText.style.color='#2196F3'
        statusColor.style.backgroundColor='#2196F3'
        
    }else{
        title.innerHTML='Disconnected'
        localStorage.setItem('Ext_state','OFF')
        chrome.runtime.sendMessage({state: 'OFF'})
        statusText.innerText='Disconnected'
        statusText.style.color='#F1592B'
        statusColor.style.backgroundColor='#F1592B'
        // checkState()
    }
})

form.addEventListener('submit',e=>{
    e.preventDefault()
    console.log('Submitted');

    if(user_id_input.value!==''){
        user_id_label.innerText=`User ID : (${user_id_input.value})`
        localStorage.setItem('localUser_ID',user_id_input.value)
        chrome.runtime.sendMessage({setId:user_id_input.value})
        if(state=='ON'){
            statusText.innerText='Connected'
        }
        statusText.style.color='#2196F3'
        statusColor.style.backgroundColor='#2196F3'
    }

    if(txt_input.value!==''){
        txt_label.innerText=`Task : (${txt_input.value})`
        localStorage.setItem('localUser_text',txt_input.value)
        chrome.runtime.sendMessage({setTask:txt_input.value})
    }

    user_id_input.value=''
    txt_input.value=''

})


const initialCheck=async()=>{
    const status=localStorage.getItem('Ext_state')
    const stored_userId=localStorage.getItem('localUser_ID')
    const stored_text=localStorage.getItem('localUser_text')

    if(status){
        if (status=='OFF') {
            state='OFF'
            toggler.checked=false
            title.innerHTML='Disconnected'
            statusText.innerText='Disconnected'
            statusText.style.color='#F1592B'
            statusColor.style.backgroundColor='#F1592B'
            
        }else{
            state='ON'
            statusText.innerText='Connected'
            statusColor.style.backgroundColor='#2196F3'
            statusText.style.color='#2196F3'
            toggler.checked=true
            
        }
    }
    else{
        state='ON'
        localStorage.setItem('state','ON')
    }

    if(stored_userId){
        userId=stored_text
        console. log('userId found',userId)
        user_id_label.innerText=`User ID : (${userId})`
    }
    else{
        statusColor.style.backgroundColor='#F1592B'
        statusText.style.color='#F1592B'
        statusText.innerText='No user id' 
    }
    if(stored_text){
        taskId=stored_text
        console. log('task found',taskId)
        txt_label.innerText=`Task : (${taskId})`
        chrome.runtime.sendMessage({setTask:text})
    }

    var port = chrome.runtime.connect({
        name: "Values exchange"
    });
    port.postMessage({checkValues:true});
    port.onMessage.addListener(function(msg) {
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
            }
        }
    });
}

initialCheck()

const handleActions=(arr)=>{
    let action_content=document.querySelector('.action-content')

    while (action_content.firstChild) {
        action_content.removeChild(action_content.firstChild);
      }

    if(arr instanceof Array){
        arr.forEach(act=>{
            let action_item=document.createElement('div')
            action_item.setAttribute('class','action-item')
    
            let action_logo=document.createElement('div')
            action_logo.setAttribute('class','action-logo')
            // action_logo.setAttribute('src','images/internet-18.png')
            action_logo.innerHTML='<img src="images/internet-18.png"/>'
    
            let action_name=document.createElement('div')
            action_name.setAttribute('class','action-name')
            action_name.innerHTML=act.name
    
            let action_btn=document.createElement('div')
            action_btn.setAttribute('class','action-btn')
            let runActBtn=document.createElement('button')
            runActBtn.setAttribute('id',act.objectId)
            runActBtn.innerHTML='Run'
    
            runActBtn.addEventListener('click',e=>{
                e.preventDefault()
                chrome.runtime.sendMessage({runOne:e.target.id})
            })
    
            action_btn.appendChild(runActBtn)
    
    
            action_item.appendChild(action_logo)
            action_item.appendChild(action_name)
            action_item.appendChild(action_btn)
    
            action_content.appendChild(action_item)
        })
    }
    else{
        action_content.innerHTML=arr
    }

    console.log(action_content);
}

const handleSchedules=(arr)=>{
    const mainE=document.querySelector('.schedule-content')
    while (mainE.firstChild) {
        mainE.removeChild(mainE.firstChild);
      }
    if(arr instanceof Array){
        arr.forEach(sched=>{
            let schedule_item=document.createElement('div')
            schedule_item.setAttribute('class','schedule-item')
    
            //Details
            let schedule_details=document.createElement('div')
            schedule_details.setAttribute('class','schedule-details')
    
            let name=document.createElement('div')
            name.setAttribute('class','name')
    
            let action_name=document.createElement('p')
            action_name.innerHTML=sched.name
            let action_pic=document.createElement('img')
            action_name.setAttribute('alt','X')
            name.appendChild(action_pic)
            name.appendChild(action_name)
    
    
            let status_info=document.createElement('div')
            status_info.setAttribute('class','status-inf')
            let st_text=document.createElement('p')
            st_text.innerHTML='Status'
            let act_st_text=document.createElement('p')
            act_st_text.innerHTML=sched.enabled?'Enabled':'Disabled'
            status_info.appendChild(st_text)
            status_info.appendChild(act_st_text)
    
    
            schedule_details.appendChild(name)
            schedule_details.appendChild(status_info)
    
    
            //Time
            let schedule_time=document.createElement('div')
            schedule_time.setAttribute('class','schedule-time')
    
            let time=document.createElement('div')
            time.setAttribute('class','time')
            let every=document.createElement('p')
            every.innerHTML=`Every ${sched.period} ${sched.every}${sched.period==1?'':'s'}`
            time.appendChild(every)
    
            let icons=document.createElement('div')
            icons.setAttribute('class','icons')
            let pause_play=document.createElement('img')
            if(sched.enabled){
                pause_play.setAttribute('src','images/pause-button-16.png')
            }else{
                pause_play.setAttribute('src','images/play-button-circled-16.png')
            }
            pause_play.setAttribute('id',sched.objectId)
    
            pause_play.addEventListener('click',e=>{
                let id=e.target.getAttribute("id")
                let src=e.target.getAttribute("src")
                if(src=='images/pause-button-16.png'){
                    // e.target.src='icons8-play-button-circled-16.png'
                    pause_play.setAttribute('src','images/play-button-circled-16.png')
                    chrome.runtime.sendMessage({updateAction:id,updateTo:'pause'})
                }
                else{
                    pause_play.setAttribute('src','images/pause-button-16.png')
                    chrome.runtime.sendMessage({updateAction:id,updateTo:'play'})
                    // e.target.src='icons8-pause-button-16.png' 
                }
    
            })
            let remove=document.createElement('img')
            remove.setAttribute('src','images/remove-16.png')
            remove.setAttribute('id',sched.objectId)
            icons.appendChild(pause_play)
            icons.appendChild(remove)

            remove.addEventListener('click',e=>{
                let id=e.target.id
                chrome.runtime.sendMessage({updateAction:id,updateTo:'delete'})
            })
    
            schedule_time.appendChild(time)
            schedule_time.appendChild(icons)
    
    
            schedule_item.appendChild(schedule_details)
            schedule_item.appendChild(schedule_time)
            
            mainE.appendChild(schedule_item)
            console.log(mainE);
        })    
    }else{
      mainE.innerHTML=arr  
    }

    handleDropDown(arr)
    
}

newSchedBtn.addEventListener('click',e=>{
    e.preventDefault()
    let origi=document.querySelector('.schedule-origi')
    let create=document.querySelector('.schedule-create')

    if(origi.style.display=='none'){
        origi.style.display='block'
        create.style.display='none'
    }else{
        origi.style.display='none'
        create.style.display='block'
        // handleDropDown()
    }

})

const handleDropDown=(arr)=>{
    console.log('This is the arr',arr);
    if(arr instanceof Array){
        const actions_dropdown=document.querySelector('#actions_dropdown')
        
        while (actions_dropdown.firstChild) {
            actions_dropdown.removeChild(actions_dropdown.firstChild);
        }


        arr.forEach(item=>{
            const option=document.createElement('option')
            option.setAttribute('value',item.objectId)
            option.setAttribute('every',item.every)
            option.setAttribute('period',item.period)
            option.innerHTML=item.name
            console.log(option);

            actions_dropdown.appendChild(option)
        })

        actions_dropdown.addEventListener('change',e=>{
            const details_every=document.querySelector('#details_every select')
            const details_period=document.querySelector('#details_period input')

            const details_status=document.querySelector('#details_status select')

            let sched
            let port = chrome.runtime.connect({
                name: "Single value x"
            });
            port.postMessage({fetchOne:true,fetchId:e.target.value});
            port.onMessage.addListener(function(msg) {
                let every=msg.schedule.every
                let period=msg.schedule.period
                let name=msg.schedule.name
                details_every.value=every
                details_period.value=period
                // console.log(msg.schedule);
            });
            

            console.log(e.target.value);
        })
    }

    const details_every=document.querySelector('#details_every select')
    details_every.value=arr[0].every
    const details_period=document.querySelector('#details_period input')
    details_period.value=arr[0].period

    const details_status=document.querySelector('#details_status select')
    details_status.value=arr[0].enabled?'Enabled':'Disabled'
    
    let det_arr=[details_every,details_period,details_status]

    // det_arr.forEach(item=>{
    //     item.addEventListener('change',e=>{
    //         console.log('Changed',e.target.value);
    //     })
    // })
}

const createSchedule=(every,period,obId)=>{
    chrome.runtime.sendMessage({copyOne:obId,period:period,every:every})
}

finalSchedBtn.addEventListener('click',e=>{
    e.preventDefault()
    let origi=document.querySelector('.schedule-origi')
    let create=document.querySelector('.schedule-create')

    const actions_dropdown=document.querySelector('#actions_dropdown')

    const details_every=document.querySelector('#details_every select')
    const details_period=document.querySelector('#details_period input')

    const details_status=document.querySelector('#details_status select')

    let every=details_every.value
    let period=details_period.value
    let obId=actions_dropdown.value

    createSchedule(every,period,obId)

    if(origi.style.display=='none'){
        origi.style.display='block'
        create.style.display='none'
    }else{
        origi.style.display='none'
        
        create.style.display='block'
    }

})


cancelBtn.addEventListener('click',e=>{
    console.log('Clicked cancel');
    e.preventDefault()
    let origi=document.querySelector('.schedule-origi')
    let create=document.querySelector('.schedule-create')
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
        console.log('idn id',idn);

        let tabcontent = document.querySelectorAll(".tabcontent");
        tabcontent.forEach(item=>{
            item.style.display='none'
            if(item.id==idn){
                item.style.display='block'
            }
        })

        if(idn=="schedules"){
            var port = chrome.runtime.connect({
                name: "Schedules exchange"
            });
            port.postMessage({fetchSchedules:true});
            port.onMessage.addListener(function(msg) {
                console.log("messooooo recieved");
                handleSchedules(msg.schedules);
            });

        }
        else if(idn=="actions"){
            console.log('Actions tab clicked');
            var port = chrome.runtime.connect({
                name: "Actions exchange"
            });
            port.postMessage({fetchActions:true});
            port.onMessage.addListener(function(msg) {
                if(msg.act_actions){
                    console.log("messooooo recieved");
                    handleActions(msg.act_actions)
                }
            });
        }
    })
})