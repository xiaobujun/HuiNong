Component({
  externalClasses: ['i-class'],

  options: {
      multipleSlots: true
  },

  properties: {
      model: {
          type: String,
          value: ''
      },
      context: {
          type: String,
          value: ''
      },
      answer:{
        type: String,
        value:''
      },
      answer_img:{
        type: String,
        value:''
      }
  }
});