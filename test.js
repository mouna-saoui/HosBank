/**
 * @param {string} s
 * @return {boolean}
 */
var isPalindrome = function(s) {
    let se = ""
    for(let a =0;a <= s.length;a++){
        if(s[a] >= 'a' && s[a] <='z'){
            se += s[a]
        }
    }

   console.log(se)
};
isPalindrome("A man, a plan, a canal: Panama")