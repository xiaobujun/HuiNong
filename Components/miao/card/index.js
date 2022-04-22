Component({
    externalClasses: ['i-class'],

    options: {
        multipleSlots: true
    },

    properties: {
        circle:{
            type: Boolean,
            value: false
        },
        full: {
            type: Boolean,
            value: false
        },
        thumb: {
            type: String,
            value: ''
        },
        title: {
            type: String,
            value: ''
        },
        subtitle: {
            type: String,
            value: ''
        },
        extra: {
            type: String,
            value: ''
        }
    }
});