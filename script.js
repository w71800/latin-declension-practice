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
      status: "使用者尚未輸入...",
      statusUpload: "尚未輸入",
      inputIsSelected: false,
      mode: "test", 
      // 新版資料架構
      inputs: {
        name: "",
        gender: "",
        type: "",
        stem: "",
        single: {},
        plural: {}
      },
    }
  },
  watch: {
    "inputs.name": function(newInput, oldInput){
      this.currentWord = this.words.find( word => word.name == newInput ) || null
      // // this.currentWord = 1
      // // 根據有無找到對應的 currentWord 來決定 status 的顯示
      // if(typeof(this.currentWord) == "object" && this.currentWord !== null && this.currentWord.type != ""){
      //   this.status = "找到了，試試看！"
      // }else{
      //   this.status = "資料庫中沒找到這個字..."
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
    }
  },
  computed: {
    // 從抓到的 currentWord 中複製對應的答案進去 ansData（單數與複數得答案所構成的 Array）
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
    // modeToBoolean(mode){
    //   // console.log(this.mode);
    //   return true 
    // }
  },
  created(){
    this.initData()
  },
  // mounted(){
  //   console.log(this.words);
  // }
})

app.mount("#app")

$(".userInput > input").focus(()=>{
  app.inputIsSelected = true
  console.log($("input"))
})
$(".userInput > input").blur(()=>{
  app.status = "使用者未輸入..."
  app.inputIsSelected = false
})
