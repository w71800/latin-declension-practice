import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
import { url } from "./static/env.js"
// import words from './static/words.js';
import db from'./configuration/firebase.js'
import { ref, set, onValue, get, off } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const wordRef = ref(db, 'words/')
const declensionRef = ref(db, 'declensions/')

const app = createApp({
  data() {
    return {
      // 格位名稱列表
      caseList: [
        {cht: "主格", eng: "NOM"},
        {cht: "屬格", eng: "GEN"},
        {cht: "與格", eng: "DAT"},
        {cht: "受格", eng: "ACC"},
        {cht: "奪格", eng: "ABL"},
        {cht: "呼格", eng: "VOC"}
      ],
      // 從資料庫抓到的詞彙資料
      words: [],
      // 當下要測試的字
      currentWord: null,
      lastWord: null,
      status: "使用者尚未輸入...",
      statusUpload: "尚未輸入",
      inputIsSelected: false,
      mode: "upload", 
      // 新版資料架構
      inputs: {
        name: "",
        gender: "",
        type: "",
        stem: "",
        single: {},
        plural: {}
      },
      randomInactive: false
    }
  },
  watch: {
    "inputs.name": function(newInput, oldInput){
      this.currentWord = this.words.find( word => word.name == newInput ) || null
      /**
       * status 顯示的規則
       * 1. inputs.name 中內部有東西但錯的時候：檢索中...
       * 2. inputs.name 中內部有東西但對的時候：找到了！
       * 3. inputs.name 內部無東西的時候：使用者尚未輸入...
     */
      // if(this.mode == "upload"){
      //   let input = this.inputs.name
      //   let answer = this.currentWord.name
      //   this.status = "檢索中..."
      // }
    },
  },
  methods: {
    toggleMode(now){
      if(now == "test"){
        this.mode = "upload"
      }else{
        this.mode = "test"
      }
      this.clearInputs()
    },
    upload(){
      /**
       * 以下流程必須要在 validator 為 true 時才會執行
       */
      let r = this.validator()
      if(r){
        let { 
          name, 
          gender,
          type,
          stem,
          single,
          plural 
        } = this.inputs
        let word, declension = {}
        let nextIndex = this.words.length
  
        word = { name, gender, type, stem }
        declension = { name, single, plural }
  
        let wordRef = ref(db, "/words/" + nextIndex)
        let declensionRef = ref(db, "/declensions/" + nextIndex)
        set(wordRef, word)
        set(declensionRef, declension).then(()=>{
          this.statusUpload = "新增成功！"
          setTimeout(()=>{
            this.statusUpload = "可以繼續新增"
          },1000)
        }).catch( err =>{
          console.log(err)
        })
        this.statusUpload = "新增中..."
      }
      
    },
    initData(){
      let tempR = [] 
      /**
       * 注意：在監聽執行 onValue 時，一開始的 tempR 宣告已不會執行到
       */
      onValue(wordRef, (snapshot)=>{
        tempR = []                      /* 將閉包的 tempR 清空 */
        let resultArr = snapshot.val()

        resultArr.forEach((item) => {
          tempR.push(item)
        })

      },{
        // onlyOnce: true
      })

      onValue(declensionRef, (snapshot)=>{
        let resultArr = snapshot.val()

        resultArr.forEach((item, i) => {
          tempR[i] = {...tempR[i], ...resultArr[i]}
        })

        this.words = tempR
      },{
        // onlyOnce: true
      })
    },
    clearInputs(){
      this.inputs = {
        name: "",
        gender: "",
        type: "",
        stem: "",
        single: {},
        plural: {}
      }
    },
    random(){
      this.clearInputs()
      let w = this.words[ parseInt(Math.random()*this.words.length ) ]
      let showWords = this.words.map( word => word.name + " " )
      let counter = 0
      // 防重複
      if(w == this.lastWord){
        let wordsTemp = [ ...this.words ]
        let wIndex = wordsTemp.indexOf(w)
        wordsTemp.splice(wIndex, 1)
        w = wordsTemp[ parseInt(Math.random()*this.words.length ) ]
      }

      let timer = setInterval(() => {
        this.randomInactive = true
        this.inputs.name = showWords[ parseInt(Math.random()*showWords.length ) ]
        counter++
        if(counter == 10) {
          this.randomInactive = false
          clearInterval(timer)
          this.inputs.name = w.name
          this.lastWord = w
        }
      },30)
    },
    checkAnswer(c, sp){
      /**
       * 顯示為綠色的條件
       * 1. 輸入不為空且要等於答案
       * 顯示為紅色的條件
       * 1. 已經有答案且...
       */
      let input = this.inputs[sp][c.eng]
      let anwser = this.answerData && this.answerData[sp][c.eng]
      if(input && input == anwser){
        return true
      }else if(input != null){
        return false
      }
      return
    },
    enterPressed(e){
      if(e.keyCode == 13){
        let r = confirm("確定要上傳嗎？")
        if(r){
          this.upload()
        }else{
          console.log("canceled");
        }
      }
    },
    validator(){
      /**
       * inputs: {
          name: "",
          gender: "",
          type: "",
          stem: "",
          single: {},
          plural: {}
        },
       */
      /**
       * 預計可以抓到哪些地方沒有填好有問題，並且在 Status 或者 alert 上提示哪些地方沒有填好
       */

    }
  },
  computed: {
    answerData(){
      let ansTemp = {
        single: {},
        plural: {}
      }
      if(this.currentWord){
        ansTemp.single = this.currentWord.single
        ansTemp.plural = this.currentWord.plural

        return ansTemp
      }
      else return null
    },
    cases(){
      let cases = []
      this.caseList.forEach( c => cases.push(c.eng) )
      return cases
    },
  },
  created(){
    this.initData()
    document.addEventListener("keyup", this.enterPressed)
  },
  // mounted(){
  //   console.log(this.words);
  // }
})



app.mount("#app")

