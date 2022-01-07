import SecondFile from "/bug/SecondFile.js";

export default class FirstFile {

    bug = () => new SecondFile().bug();

}
