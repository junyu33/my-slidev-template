# 审稿意见分析与实验计划

周俊宇 2025/12/29

---

## 上次评论的意见

我将上次拒稿的审稿意见进行了整理，针对实验部分，梳理出以下几点（从重要到次要排序）：

### 一、评估方法不公、对比对象存疑：

- (44B) "This has several drawbacks: * as they say, this induces some overhead (memory management, initialization)... * more importantly, gf2x includes a tuning mechanism... Thus the comparison with gf2x is not fair." 

<v-click>

实验组：手写 carryless-mul 和 reduction，不使用任何封装。

对照组：调用了启用 gf2x 模块的 NTL，carryless-mul 部分由 gf2x 实现，reduction 部分由 NTL 实现。

</v-click>

<v-click>

我意识到了NTL封装可能带来的性能问题，在性能分析中计算了 NTL 开销可能带来的 overhead。上次 CHES 的审稿人并没有攻击这一点。然而这次 44B 注意到了，但他认为可能仅仅分析 overhead 不够，并且再加上我没提供 commit number 和是否使用 tuning 机制，仍然认为我的实验不公平。

解决方案：只用自己的手写 carryless-mul 算法，与 tuning 后的 gf2x 本身进行对比，不对比 reduction。

</v-click>

---

- (44B) "In 6.2 you compare to gf2x/NTL, but gf2x has no modular reduction!"

<v-click>

这是我的论文表述问题，44B 理解成了我同时跟 gf2x 和 NTL 做了对比，但实际上我做的是调用了启用 gf2x 模块的 NTL。解决方案同上个问题。

</v-click>

- (44C) Also, they say that 'gf2x currently lacks support for the dedicated carryless multiplication instructions'. How would NTL take advantage of these instructions and how big of an impact would they have? 

<v-click>

这是一个温和的问题。NTL 并没有对 arm/riscv 做硬件指令的优化，而 gf2x 也只做了 x86 的 pclmulqdq。因此，假如我在 gf2x 仓库中 push 了arm/riscv 硬件指令，gf2x和 NTL 都会获得硬件性能的提升。

</v-click>

--- 

### 二、ILP/DP 优化过程中的成本估算不准确

- (44B) "Another concern is that the DP optimization process is using some guessed costs for AND, OR, XOR, CLMUL. These costs can vary a lot between processors... It would be better to have a DP optimization process on real code..."

<v-click>

弱化这部分的建模文字，只给出 DP 代码，简要叙述一下建模过程和相关数据来源即可，并强调这些数据仅供参考，不保证“全局最优”。把重心放在具体硬件的实验数据上。

</v-click>

### 三、缺乏细粒度的加速分析

- (44C) "In the evaluation, it would be useful to see a more fine-grained analysis of the speed-up of the proposed algorithms... In the current state, it is impossible to tell, for example, how much of the speed-up in Figure 1 is due to improvements in multiplication and how much due to modular reduction."

- (44C) "In fact, I believe that such an analysis is more important than the subsequent evaluations they present in Sections 6.2 and 6.3, which hide the impact of the contribution behind unrelated overhead."

<v-click>

可以补充，但大概率 reduction 的性能提升很微小，因为 $\Delta$ 小的规约多项式目前并不常用。我打算将细粒度分析放在使用与不使用硬件指令的性能提升对比上。

</v-click>


---

### 四、缺乏具体案例和详细对比，验证声明困难

- (44A) "My main concern with the paper is the following. I would like details of at least one concrete example to verify the claims... For this field, the author can fix g(x), and provide the operation count for performing field multiplication using the best known previous method, and the operation count obtained from the new method."

<v-click>

审稿人想要一个完整的乘法（carryless+reduction）对应的 cycles，和目前的已知方法进行对比。然而我的数据只给了 carryless 的 cycles 分析。

解决方案是忽略该问题，参考合作者的意见，弱化 cycles 这一点，强调实验结果。

</v-click>

- (44A) "The implementation results reported by the authors seem to suggest a drastic improvement. So one would expect also expect a drastic reduction in the operation count by the new method over the previous method."

<v-click>

这似乎比较困难，因为不太好找一个只做 reduction “权威的例子” 作为对照组。因此我选择忽略该问题。

</v-click>

--- 

### 五、代码未公开，结果不可复现

- "Also, the authors' code is not available, which makes it hard to reproduce their results and/or understand what they have really implemented."

解决方案：公开实验代码以及测试数据。

### 六、其他疑问

- "Table 6: for m=409, I don't understand how you get 177 and 236 using K^*_3... Same for m=571..."

- "Page 17 'except at very large degrees': on my machine, the Karatsuba threshold for gf2x is 10 words, and 38 words for Toom-Cook, which is not 'very large degrees'."

解决方案：

关于第一个问题，可能是我自己哪儿算错，被他发现了。我也不知道自己当时是怎么想的。

关于第二个问题，解决方案同之前的问题，弱化 cycles 建模过程，只提优化算法本身。（碰到了内行就是痛苦）