import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
import { url } from "./static/env.js"
// import words from './static/words.js';
import db from'./configuration/firebase.js'
import { ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const wordRef = ref(db, 'words/')
const declensionRef = ref(db, 'declensions/')
// console.log(words);

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
      // 使用者的當下輸入
      userInput: "",
      // 當下要測試的字
      currentWord: null,
      genderInput: "",
      typeInput: "",
      stemInput: "",
      status: "使用者尚未輸入...",
      statusUpload: "尚未輸入",
      inputData: {
        singleInputs: [],
        pluralInputs: []
      },
      inputIsSelected: false,
      mode: "upload"
    }
  },
  watch: {
    userInput: function(newInput, oldInput){
      // 從資料包中尋找對應使用者輸入的單數主格，找到了的話並把它放在 currentWord，沒找到則傳回 0
      this.currentWord = this.words.find( word => word.name == this.userInput ) || null

      // 根據有無找到對應的 currentWord 來決定 status 的顯示
      if(typeof(this.currentWord) == "object" && this.currentWord !== null && this.currentWord.type != ""){
        this.status = "找到了，試試看！"
        console.log(this.currentWord);
      }else{
        this.status = "資料庫中沒找到這個字..."
      }
    },
    words(){
      console.log("改變了")
    }
  },
  methods: {
    toggleMode(now){
      if(now == "test"){
        this.mode = "upload"
        // issue：記得要清空所有的資料與輸入
      }else{
        this.mode = "test"
      }
    },
    upload(){
      let word, declension = {}
      word = {
        name: this.userInput,
        gender: this.genderInput,
        type: this.typeInput,
        stem: this.stemInput
      }
      declension = {
        name: this.userInput,
        single: this.singleInputs,
        plural: this.pluralInputs
      }
      let nextIndex = this.words.length
      let wordRef = ref(db, "/words/" + nextIndex)
      let declensionRef = ref(db, "/declensions/" + nextIndex)
      // set(wordRef, nextIndex)
      set(declensionRef, nextIndex).then(()=>{
        this.statusUpload = "新增成功！"
        setTimeout(()=>{
          this.statusUpload = "可以繼續新增"
        },1000)
      })
      this.statusUpload = "新增中..."
    }
  },
  computed: {
    // 從抓到的 currentWord 中複製對應的答案進去 ansData（單數與複數得答案所構成的 Array）
    answerData(){
      if(this.currentWord){
        let ansTemp = {
          singleInputs: [],
          pluralInputs: []
        }

        ansTemp.singleInputs = [
          this.currentWord.single.NOM,
          this.currentWord.single.GEN,
          this.currentWord.single.DAT,
          this.currentWord.single.ACC,
          this.currentWord.single.ABL,
          this.currentWord.single.VOC,
        ]
        ansTemp.pluralInputs = [
          this.currentWord.plural.NOM,
          this.currentWord.plural.GEN,
          this.currentWord.plural.DAT,
          this.currentWord.plural.ACC,
          this.currentWord.plural.ABL,
          this.currentWord.plural.VOC,
        ]
        return ansTemp
      }
      else return null
    },
    // modeToBoolean(mode){
    //   // console.log(this.mode);
    //   return true 
    // }
  },
  created: function(){
    let tempR = []

    onValue(wordRef, (snapshot)=>{
      let resultArr = snapshot.val()

      resultArr.forEach((item) => {
        tempR.push(item)
      })
    })

    onValue(declensionRef, (snapshot)=>{
      let resultArr = snapshot.val()

      resultArr.forEach((item, i) => {
        tempR[i] = {...tempR[i], ...resultArr[i]}
      })

      this.words = tempR
    })
  },
})

app.mount("#app")

$(".userInput > input").focus(()=>{
  app.inputIsSelected = true
})
$(".userInput > input").blur(()=>{
  app.status = "使用者未輸入..."
  app.inputIsSelected = false
})