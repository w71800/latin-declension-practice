//- Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getDatabase, ref, set, onValue } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-database.js";
//- TODO: Add SDKs for Firebase products that you want to use
//- https://firebase.google.com/docs/web/setup#available-libraries

//- Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyB944JtG04PmGFTbRB9TmNru68Zs55ERuQ",
  authDomain: "database-for-delension.firebaseapp.com",
  projectId: "database-for-delension",
  storageBucket: "database-for-delension.appspot.com",
  messagingSenderId: "589462440452",
  appId: "1:589462440452:web:a399ece738d1597afe0351",
  databaseUrl: "https://database-for-delension-default-rtdb.firebaseio.com/"
};

//- Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getDatabase()




/* 
  structure of wordObj
  {
    name: "homo",
    gender: "M",
    type: "3rd",
    stem: "homin-"
  }

  structure of declensionObj
  {
    name: "homo",
    single: {
      NOM: "homo",
      GEN: "hominis",
      DAT: "homini",
      ACC: "hominem",
      ABL: "homine",
      VOC: "homo"
    },
    plural: {
      NOM: "homines",
      GEN: "hominum",
      DAT: "hominibus",
      ACC: "homines",
      ABL: "hominibus",
      VOC: "homines"
    }
  }
  */

function getRef(id) {
  let wordRef = ref(db, 'words/' + id)
  let declensionRef = ref(db, 'declensions/' + id)
  return { wordRef, declensionRef }
}


 // words 為 Vue 物件中的 words
function setData(id = words.length, word, declension) {
  // let id = words.length
  set(getRef(id).wordRef, word);
  set(getRef(id).declensionRef, declension);
}

function listenData(id){
  onValue(getRef(id).wordRef, (snapshot)=>{
    let dataShot = snapshot.val()
    console.log(dataShot);
  })
  onValue(getRef(id).declensionRef, (snapshot)=>{
    let dataShot = snapshot.val()
    console.log(dataShot);
  })
}
export { setData, listenData }