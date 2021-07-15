console.clear()

// 這邊是 sheet 的 ID
var sheetID = "1wsjKUia5KvuUzFjs_97a5tir3583KZXDIuBGvmKYsZQ"
var sheetNum = 1
// 這是 url 的格式
const url = "https://spreadsheets.google.com/feeds/list/" + sheetID +"/" + sheetNum + "/public/values?alt=json";


var vm = new Vue({
  el: "#app",
  data: {
    caseList: [
      {cht:"主格",eng:"NOM"},
      {cht:"屬格",eng:"GEN"},
      {cht:"與格",eng:"DAT"},
      {cht:"受格",eng:"ACC"},
      {cht:"奪格",eng:"ABL"},
      {cht:"呼格",eng:"VOC"}
    ],
    words: [],
    userInput: "",
    currentWord: null,
    status: "使用者尚未輸入...",
    inputData: {
      singleInputs: [],
      pluralInputs: []
    },
    inputIsSelected: false,
  },
  watch: {
    userInput: function(newInput,oldInput){
      // 從資料包中尋找對應使用者輸入的單數主格，找到了的話並把它放在 currentWord，沒找到則傳回 0
      this.currentWord = this.words.find( word => word.single.NOM == this.userInput ) || null
      console.log(this.currentWord)

      // 根據有無找到對應的 currentWord 來決定 status 的顯示
      if(typeof(this.currentWord) == "object" && this.currentWord !== null && this.currentWord.type != ""){
        this.status = "找到了，試試看！"
      }else{
        this.status = "資料庫中沒找到這個字..."
      }
    },
  },
  computed: {
    // 從抓到的 currentWord 中複製對應的答案進去 ansData（單數與複數得答案所構成的 Array）
    ansData: function(){
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
    }
  },
  created: function(){
    // Vue 物件生成時執行 ajax 取得字彙資料包並處理
    const self = this;
    $.ajax({
    url: url,
    success: function(evt){
      let dataContainer = []
      let rawData = evt.feed.entry
      let dicUrl = "http://www.latin-dictionary.net/search/latin/"
      rawData.forEach((item)=>{
      let wordData = {
          stem: item.gsx$詞幹.$t,
          type: item.gsx$性別.$t,
          declension: item.gsx$變格.$t,
          single: {
            NOM: item.gsx$nomsg.$t,
            GEN: item.gsx$gensg.$t,
            DAT: item.gsx$datsg.$t,
            ACC: item.gsx$accsg.$t,
            ABL: item.gsx$ablsg.$t,
            VOC: item.gsx$vocsg.$t,
          },
          plural: {
            NOM: item.gsx$nompl.$t,
            GEN: item.gsx$genpl.$t,
            DAT: item.gsx$datpl.$t,
            ACC: item.gsx$accpl.$t,
            ABL: item.gsx$ablpl.$t,
            VOC: item.gsx$vocpl.$t,
          },
        }
        dataContainer.push(wordData)
      })
      self.words = dataContainer
      },
    })
  },
})



$(".userInput > input").focus(()=>{
  vm.inputIsSelected = true
})
$(".userInput > input").blur(()=>{
  vm.status = "使用者未輸入..."
  vm.inputIsSelected = false
})
