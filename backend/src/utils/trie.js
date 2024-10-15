class TrieNode {
    constructor() {
      this.children = {};
      this.isEndOfWord = false;
      this.artistNames = [];
    }
  }
  
  class Trie {
    constructor() {
      this.root = new TrieNode();
    }
  
    // Insert a word into the Trie
    insert(word, artistName) {
      let currentNode = this.root;
      for (const char of word.toLowerCase()) {
        if (!currentNode.children[char]) {
          currentNode.children[char] = new TrieNode();
        }
        currentNode = currentNode.children[char];
        if (currentNode.artistNames.length < 5) {
          currentNode.artistNames.push(artistName);
        }
      }
      currentNode.isEndOfWord = true;
    }
  
    // Search for suggestions based on a prefix
    search(prefix) {
      let currentNode = this.root;
      for (const char of prefix.toLowerCase()) {
        if (!currentNode.children[char]) {
          return []; // If prefix not found, return empty array
        }
        currentNode = currentNode.children[char];
      }
      return currentNode.artistNames; // Return top suggestions for the prefix
    }
  }
  
  module.exports = Trie;
  