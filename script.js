import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
import { url } from "./static/env.js"
// import words from './static/words.js';
import db from'./configuration/firebase.js'
import { ref, set, onValue, get } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

// console.log(words);

const app = createApp({
  data() {
    return {
      // 格位名稱列表
      caseList: [
        {cht:"主格", eng:"NOM"},
        {cht:"屬格", eng:"GEN"},
        {cht:"與格", eng:"DAT"},
        {cht:"受格", eng:"ACC"},
        {cht:"奪格", eng:"ABL"},
        {cht:"呼格", eng:"VOC"}
      ],
      // 從資料庫抓到的詞彙資料
      words: [],
      // 使用者的當下輸入
      userInput: "",
      // 當下要測試的字
      currentWord: null,
      status: "使用者尚未輸入...",
      statusUpload: "尚未輸入",
      inputData: {
        singleInputs: [],
        pluralInputs: []
      },
      inputIsSelected: false,
      mode: "test"
    }
  },
  watch: {
    userInput: function(newInput,oldInput){
      // 從資料包中尋找對應使用者輸入的單數主格，找到了的話並把它放在 currentWord，沒找到則傳回 0
      this.currentWord = this.words.find( word => word.single.NOM == this.userInput ) || null
      // console.log(this.currentWord)

      // 根據有無找到對應的 currentWord 來決定 status 的顯示
      if(typeof(this.currentWord) == "object" && this.currentWord !== null && this.currentWord.type != ""){
        this.status = "找到了，試試看！"
      }else{
        this.status = "資料庫中沒找到這個字..."
      }
    },
  },
  methods: {
    toggleMode(now){
      if(now == "test"){
        this.mode = "upload"
      }else{
        this.mode = "test"
      }
      console.log(`模式已被更改為：${this.mode}`);
    },
  },
  computed: {
    // 從抓到的 currentWord 中複製對應的答案進去 ansData（單數與複數得答案所構成的 Array）
    ansData(){
      // 寫的有點醜，但原理就是從 currentWord 中將答案放到 ansData 屬性中的陣列，再於 HTML 中使用 v-if 和來判斷使用者輸入與答案是否有一樣，一樣者則渲染出勾勾的 icon
      if(this.currentWord){
        let ansTemp = {
          singleInputs: [],
          pluralInputs: []
        }
        ansTemp.singleInputs = [this.currentWord.single.NOM,this.currentWord.single.GEN,this.currentWord.single.DAT,this.currentWord.single.ACC,this.currentWord.single.ABL,this.currentWord.single.VOC,]
        ansTemp.pluralInputs = [this.currentWord.plural.NOM,this.currentWord.plural.GEN,this.currentWord.plural.DAT,this.currentWord.plural.ACC,this.currentWord.plural.ABL,this.currentWord.plural.VOC,]
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
    let results = []
    let wordRef = ref(db, 'words/')
    let declensionRef = ref(db, 'declensions/')

    onValue(wordRef,(snapshot)=>{
      let resultArr = snapshot.val()
      resultArr.forEach((item, i)=>{
        results.push(item)
      })
      
    })
    onValue(declensionRef,(snapshot)=>{
      let resultArr = snapshot.val()
      resultArr.forEach((item, i)=>{
        results[i] = {...resultArr[i]}
      })
      console.log(results);
    })

    this.words = results
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