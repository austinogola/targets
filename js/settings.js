const powerBtn=document.querySelector('#powerBtn')
const powerBtn2=document.querySelector('#powerBtn2')
const flip=document.querySelector('.flip')
const flip2=document.querySelector('.flip2')
const form=document.querySelector('form')
const txt_label=document.querySelector('#text_label')
const user_id_label=document.querySelector('#user_id_label')

const resetBtn=document.querySelector('#resetBtn')

let inputs=document.querySelectorAll('input')
let labels=document.querySelectorAll('label')

const statusDiv=document.querySelector('#statusDiv')

let state,taskId,userId,autos


labels.forEach(label=>{
    label.addEventListener('click',e=>{
        let targ=e.target.parentElement
        let inp=targ.querySelector('input')
        inp.focus()
    })
})

form.addEventListener('submit',e=>{
    e.preventDefault()

    if(user_id_input.value!==''){
        // user_id_label.innerText=`User ID : (${user_id_input.value})`
        user_id_label.innerText=`User ID`
        user_id_label.classList.add('active')
        form.querySelector('#userId_field').placeholder=user_id_input.value

        localStorage.setItem('localUser_ID',user_id_input.value)
        chrome.storage.local.set({userId:user_id_input.value})
        chrome.runtime.sendMessage({setId:user_id_input.value})
    }

    if(txt_input.value!==''){
        // txt_label.innerText=`Task : (${txt_input.value})`
        txt_label.innerText=`Task`
        txt_label.classList.add('active')
        form.querySelector('#text_field').placeholder=txt_input.value

        localStorage.setItem('localUser_text',txt_input.value)
        chrome.runtime.sendMessage({setTask:txt_input.value})
    }

    user_id_input.value=''
    txt_input.value=''

})

const checkFields=()=>{
    const stored_userId=localStorage.getItem('localUser_ID')
    const stored_text=localStorage.getItem('localUser_text')

    if(stored_userId){
        user_id_label.innerText=`User ID`
        user_id_label.classList.add('active')
        document.querySelector('#userId_field').placeholder=stored_userId
    }
    else{
        user_id_label.classList.remove('active')
    }

    if(stored_text){
        taskId=stored_text
        txt_label.innerText=`Task`
        txt_label.classList.add('active')

        document.querySelector('#text_field').placeholder=stored_text
    }
    else{
        // txt_label.classList.remove('active')  
    }
}

inputs.forEach(iput=>{
    iput.addEventListener('focus',e=>{
        let targ=e.target.parentElement
        let label=targ.querySelector('label')
        label.classList.add('active')
        e.target.placeholder=''
        // iput.placeholder=''
        // checkFields()
    })
})
inputs.forEach(iput=>{
    iput.addEventListener('blur',e=>{
        let targ=e.target.parentElement
        let label=targ.querySelector('label')

        if(iput.value.length>=1){

        }
        else{
            label.classList.remove('active')
            e.target.placeholder=''
            checkFields()
        }
        // 
        
    })
})

flip.addEventListener('click',e=>{
    document.querySelector('.flip span').style.transition='all .3s'
    const sp=document.querySelector('.flip span')
    if(sp.classList.contains('active')){
        turnOff()

    }
    else{
        turnOn()

    }
})

resetBtn.addEventListener("click",e=>{
    e.preventDefault()
    localStorage.removeItem('localUser_text');
    form.querySelector('#text_field').placeholder=''
    form.querySelector('#text_field').value=''
    document.querySelector('#text_label').classList.remove('active')
    chrome.runtime.sendMessage({setTask: null})

    // checkFields()
})


const autosOff=()=>{
    const sp=document.querySelector('.flip2 span') 
    sp.classList.remove('active')
    chrome.storage.local.set({autos:'OFF'})
    autos='OFF'
    chrome.runtime.sendMessage({autos: 'OFF'})
}

const autosOn=()=>{
    const sp=document.querySelector('.flip2 span') 
    sp.classList.add('active')
    chrome.storage.local.set({autos:'ON'})
    autos='ON'
    chrome.runtime.sendMessage({autos: 'ON'})
}

flip2.addEventListener('click',e=>{
    document.querySelector('.flip2 span').style.transition='all .3s'
    const sp=document.querySelector('.flip2 span')
    if(sp.classList.contains('active')){
        autosOff()
    }
    else{
        autosOn()

    }
})
const turnOn=async()=>{
    const sp=document.querySelector('.flip span')
    sp.classList.add('active')
    chrome.storage.local.set({state:"ON"})
    chrome.runtime.sendMessage({state: 'ON'})
    // await sleep(200)
}

const turnOff=async()=>{
    const sp=document.querySelector('.flip span')
    sp.classList.remove('active')
    chrome.storage.local.set({state:'OFF'})
    chrome.runtime.sendMessage({state: 'OFF'})
    
}

// powerBtn.addEventListener('click',async (e)=>{
//     e.preventDefault()
//     if(e.target.classList.contains('active')){
//         turnOff()
//     }
//     else{
//         turnOn()
        
//     }
    
// })


const initialCheck=async()=>{

    let status=await chrome.storage.local.get('state')
    status=status.state

    const stored_userId=localStorage.getItem('localUser_ID')
    const stored_text=localStorage.getItem('localUser_text')
    let autos_val=await chrome.storage.local.get('autos')
    autos_val=autos_val.autos
    console.log('autos',autos_val);

    if(status){
        state==status
        document.querySelector('.flip span').style.transition='all .1s'
        status=='OFF'?turnOff():turnOn()
    }
   
    if(autos_val){
        autos=autos_val
        document.querySelector('.flip2 span').style.transition='all .1s'
        autos=='ON'?autosOn():autosOff()
    }

    if(stored_userId){
        userId=stored_userId
        // user_id_label.innerText=`User ID : (${userId})`
        user_id_label.innerText=`User ID`
        user_id_label.classList.add('active')
        document.querySelector('#userId_field').placeholder=stored_userId

        chrome.runtime.sendMessage({setId:userId,reload:false})
    }
    else{
        user_id_label.classList.remove('active')
    }

    if(stored_text){
        taskId=stored_text
        // txt_label.innerText=`Task : (${taskId})`
        txt_label.innerText=`Task`
        txt_label.classList.add('active')

        document.querySelector('#text_field').placeholder=stored_text
    }
    else{
        txt_label.classList.remove('active')  
    }

    return
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
                if(msg.absent.includes('autos') && autos){
                    chrome.runtime.sendMessage({autos: autos})
                }
            }
            // port.disconnect(()=>{
            //     // console.log('Disconnected port');
            // })
        }
    });
}

initialCheck()