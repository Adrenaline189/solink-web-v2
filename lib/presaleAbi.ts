export const presaleAbi = [
  {
    "type": "function",
    "name": "buy",
    "stateMutability": "payable",
    "inputs": [
      { "name": "minTokensOut", "type": "uint256" }
    ],
    "outputs": []
  },
  {
    "type": "function",
    "name": "price", // price in wei per token, optional
    "stateMutability": "view",
    "inputs": [],
    "outputs": [{ "type": "uint256" }]
  }
] as const;
