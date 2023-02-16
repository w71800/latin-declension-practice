import { createApp } from "https://unpkg.com/vue@3/dist/vue.esm-browser.js"
import db from'./configuration/firebase.js'
import { ref, set, onValue, get, off } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";

const wordRef = ref(db, 'words/')
const declensionRef = ref(db, 'declensions/')

const app = createApp({
  data() {
    return {
      caseList: [
        {cht: "主格", eng: "NOM"},
        {cht: "屬格", eng: "GEN"},
        {cht: "與格", eng: "DAT"},
        {cht: "受格", eng: "ACC"},
        {cht: "奪格", eng: "ABL"},
        {cht: "呼格", eng: "VOC"}
      ],
      
      words: [],          /* 從資料庫抓到的詞彙資料 */
      currentWord: null,  /* 當下要測試的字 */
      lastWord: null,     /* 上一個測試的字 */
      status: "尚未輸入",
      statusClass: null,
      mode: "test", 
      inputs: {
        name: "",
        gender: "",
        type: "",
        stem: "",
        single: {},
        plural: {}
      },

      // 開發用
      // inputs: {
      //   name: "rex",
      //   gender: "M",
      //   type: "3rd",
      //   stem: "reg-",
      //   single: {NOM:"rex", GEN:"regis", DAT: "regi", ACC: "regem", ABL: "rege", VOC: "rex"},
      //   plural: {NOM:"reges", GEN:"regum", DAT: "regibus", ACC: "reges", ABL: "regibus", VOC: "reges"}
      // },
      randomInactive: false
    }
  },
  watch: {
    "inputs.name": function(newInput, oldInput){
      this.currentWord = this.words.find( word => word.name == newInput ) || null

      if(this.mode == "test") {
        if(newInput == ""){
          this.status = "尚未輸入"
          this.statusClass = null
        }else if(this.currentWord == null){
          this.status = "搜尋中..."
          this.statusClass = null
        }else{
          this.status = "找到了！"
          this.statusClass = "answerFound"
        }
      }
      if(this.mode == "upload"){
        if(newInput == ""){
          this.status = "尚未輸入"
          this.statusClass = null
        }else{
          this.status = "輸入中..."
          this.statusClass = null
        }
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
      this.clearInputs()
    },
    upload(){
      // 開發用
      // let r = true || this.validator()

      /**
       * 以下流程必須要在 validator 為 不為 "LACK" 或 "EXIST" 時才會執行
       */
      let r = this.validator()

      if(r == "LACK"){
        this.status = "資料有缺，請補上"
        this.statusClass = "notOK"
        this.resetStatus()
      }else if(r == "EXIST"){
        console.log(r);
        this.status = `${this.inputs.name} 已經有了！`
        this.statusClass = "notOK"
        setTimeout(()=>{
          this.clearInputs()
        }, 1000)
      }else{
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
        console.log(word, declension);
        set(wordRef, word)
        set(declensionRef, declension).then(()=>{
          this.clearInputs()
          this.status = "新增成功！"
          this.statusClass = "OK"
          setTimeout(()=>{
            this.resetStatus()
          })
          this.clearInputs()
          this.resetStatus()
        }).catch( err =>{
          console.log(err)
        })
        this.status = "新增中..."
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
    enterPressed(evt){
      if(evt.keyCode == 13 && this.mode == "upload"){
        let r = confirm("確定要上傳嗎？")
        if(r){
          this.upload()
        }else{
          console.log("canceled");
        }
      }
    },
    resetStatus(){
      let timer = setTimeout(()=>{
        this.statusClass = null
        this.status = "尚未輸入"
        clearTimeout(timer)
      }, 5000)
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
       * 1. 抓到哪些地方沒有填好有問題，並且在 Status 或者 alert 上提示哪些地方沒有填好
       * 2. 檢查有無重複的字，而後將輸入欄清空
       */
      let es = Object.entries(this.inputs)
      let list = [] /* 有問題的清單 */
      let isExist = this.words.find( word => word.name == this.inputs.name ) /* 重複的字的搜尋 */
      
      // 驗證的底層邏輯
      for(let e of es){
        let key = e[0]
        let value = e[1]

        // 抓到空缺的基本資料 key 值
        if(value == "") {
          list.push(key)
        }

        // 如果是 single 和 plural 的話，檢查物件內 case 缺少哪些
        if( key == "single" || key == "plural" ){
          let declensionV = Object.entries(value)       /* ex. [ ["NOM", "？"], ["GEN", "？"], ... ] */
          let caseResult = declensionV.map( r => r[0] ) /* 抽出目前有的 case */
          let cases = [...this.cases]                   /* 完整的 case 清單以作比較 */

          // 1. 抓出答案是 ""
          let valueResult = declensionV.filter( r => r[1] == "" ) /* 抽出值為 "" 的 case */
          valueResult.forEach( item => {
            list.push(`${key} ${item[0]}`)                       /* ex. single NOM */
          } )

          // 2. 比對完整清單，抓出缺少的 case
          let r = cases.filter( c => {
            return caseResult.indexOf(c) == -1
          })
          // 再推入問題清單
          r.forEach( item => list.push(`${key} ${item}`) )      /* ex. plural DAT */
        }
      }

      // 後續回傳處理及提示
      if(list.length != 0){
        alert(list.join("\n") + "\n\n有問題！")
        return "LACK"
      }else if(isExist){
        alert(`${this.inputs.name} 已經有了！`)
        return "EXIST"
      }else{
        return true     /* 這邊沒問題就回傳 true 的結果給 upload() */
      }
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

