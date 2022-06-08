module.exports = async (element) => {
    let question = new Object();

    // question.qBubbleImgSrc = element.qImgs
    question.qDescription = element.qDescription
    question.qImgs = element.qImgs
    
    return question
};
