# Fast AVX-512 Implementation of the Optimal Ate Pairing on BLS12-381

Hao Cheng, Georgios Fotiadis, Johann Großschädl, Daniel Page

---

## 上次内容回顾

在上次分享中，我们介绍了 Weil pairing 和 Tate pairing 在密码学中的应用。其中对于 reduced Tate pairing 的内容摘要如下：

<v-click>

> Tate pairing 与 weil pairing 的区别是其椭圆曲线定义在有限域 $\mathbb{F}_q$ 上，而后者可以是任意域。我们定义：
>
> $$
> \hat\tau_\ell(P, Q) = (\frac{f_{\ell,P}(Q + S)}{f_{\ell,P}(S)})^{(q-1)/\ell} \in \mathbb{F}_q
> $$
>
> 其中 $\ell$ 是质数，$P \in E(\mathbb{F}_q)[\ell]$，$Q \in E(\mathbb{F}_q)$，$q \equiv 1 \pmod \ell$.

</v-click>

<v-click>

实际上更一般的情况是，reduced Tate pairing 也可以在扩域 $\mathbb{F}_{q^k}$ 定义，这里的 $k$ 称为嵌入次数（embedding degree），满足 $\ell \mid q^k - 1$。则上一节的计算形式则应该对应：

$$
\hat{t}_\ell(P,Q)
=
\left(
\frac{f_{\ell,P}(Q+S)}{f_{\ell,P}(S)}
\right)^{(q^k-1)/\ell}
\in \mu_\ell \subset \mathbb{F}_{q^k}^* .
$$

</v-click>

<v-click>

在密码学语境中，原来的分式 $\frac{f_{\ell,P}(Q+S)}{f_{\ell,P}(S)}$ 通常会被简写为 $f_{\ell,P}(D_Q)$，其中 $D_Q$ 是代表 $Q$ 的零次除子，例如 $D_Q = [Q+S] - [S]$。其实就是上次分享中“有理函数对除子求值”的形式：正项进分子，负项进分母。

</v-click>


---

## 从 reduced Tate 到 optimal ate

然后回到上一次组会的未来预告：

> 可以发现，reduced Tate pairing 的 Miller function 计算量比 Weil pairing 少一半，并且仍满足单位根和双线性两个性质，所以在密码学中更受青睐。例如 Tate pairing 的变种 ate pairing 在以太坊中被广泛使用，而 CHES 上现在仍有针对 optimal ate pairing 的优化工作。
> https://eprint.iacr.org/2025/1283

<v-click>

上一次分享提到：Weil pairing 需要两个 Miller 函数；reduced Tate 只需要一个。接下来真正的优化，是让这一个 Miller loop 尽可能短。

</v-click>

<v-click>

Miller 算法按整数 $m$ 的二进制展开做 double-and-add：

$$
\text{div}(f_P)=m[P]-[mP]-(m-1)[\mathcal{O}]
$$

这里的 $m$ 就是 Miller loop 的参数；$m$ 越短，循环越短。

</v-click>

<v-clicks>

- reduced Tate pairing：Miller loop 扫 $\ell$，其中 $\ell$ 是曲线大素数阶子群的阶。
- ate pairing：针对椭圆曲线，Miller loop 扫 $T=t-1$，其中 $t$ 是 Frobenius trace。
- optimal ate pairing：进一步利用 pairing-friendly curve 的参数化结构，让 loop parameter 接近理论最短。

</v-clicks>

---

## BLS12-381 实现

这里以 BLS12-381 为例。它是一条常用的 pairing-friendly elliptic curve，定义在约 $381\text{-bit}$ 的素域上，嵌入次数 $k=12$，常用于 BLS signatures、zk-SNARKs 和以太坊相关协议。

<v-click>

回到上一页，对于经典的 reduced Tate pairing，Miller loop 参数

$$\ell \approx 255\text{-bit}$$

</v-click>

<v-click>

对于 ate pairing，Hasse 定理

$$\#E(\mathbb{F}_q)=q+1-t,\qquad |t|\le 2\sqrt q$$

告诉我们 $t \sim \sqrt{q}$，因此 Miller loop 参数 $T=t-1 < 192\text{-bit}$。

</v-click>

<v-click>

而对于 optimal ate pairing，通过进一步利用曲线 seed $z$，
把 loop parameter 降到：

$$
\qquad z \approx 64\text{-bit}.
$$

因此可以粗略理解为：optimal ate 用更短的整数来跑 Miller loop，相比于最开始的 reduced Tate pairing 有 $4 \times$ 的速度提升。

</v-click>

---

## 这篇论文优化什么？

我们现在要面对的是这样的一个式子，我们记 optimal ate pairing 为 $e_{\mathrm{OATE}}$，则：

$$
\hat{\tau}_\ell(P,Q)
=
f_{\ell,P}(D_Q)^{(q^k-1)/\ell}
\quad\Longrightarrow\quad
e_{\mathrm{OATE}}(Q,P)
=
f_{z,Q}(D_P)^{(p^{12}-1)/r}.
$$

<v-click>

主要分为两部分的计算，第一部分就是 $f_{z,Q}(D_P)$ 这个 Miller loop，第二部分就是做 $(p^{12}-1)/r$ 这个 final exponentiation，下图给出了这两块各自时间的占比（前者 42%，后者 57%）：

</v-click>

<v-click>

<div class="flex justify-center mt-4">
  <img src="./img/cheng-image.png" class="w-3/4" />
</div>

</v-click>

---

然后我们立即有两个问题需要解答：What to optimize? How to optimize?

<v-click>

对于第一个问题，为了得到最大 speedup，Cheng 等人自然是除了 other 之外，全都要优化。具体而言，论文提出了以下六个优化点：

</v-click>

<v-click>

- $\mathbb{F}_{p^{12}}$ cyclotomic squaring (`cyclotomic_sqr_fp12`)
- $\mathbb{F}_{p^{12}}$ multiplication (`mul_fp12`)
- $\mathbb{F}_{p^{12}}$ sparse multiplication (`mul_by_xy00z0_fp12`)
- $\mathbb{F}_{p^{12}}$ squaring (`sqr_fp12`)
- point doubling & line computation (`line_dbl`)
- point addition & line computation (`line_add`)

</v-click>

<v-click>

而对于后者，他们敏锐的发现 BLS12-381 曲线广泛使用的高性能实现 blst（就是用在以太坊的那个）的确使用了 x64 assembly、`BMI2/ADX` 等标量大整数优化；但这并不是 SIMD 的向量化实现，因此这给具有高度向量化的 `AVX-512IFMA` (Integer Fused Multiply-Add) 指令的机器带来了优化空间。

</v-click>

<v-click>

> 这其实也解释了为什么 blst 不做，因为支持这种指令集的设备很少，而区块链共识/验证路径需要稳定、可移植，这本身就存在一些 tradeoff.

</v-click>

---

## AVX-512IFMA 本身能力

论文使用的指令集是 `AVX512-IFMA`，`AVX512` 代表存在长度为 512bit 的向量寄存器，可以看成 8 个 64-bit lane 的小寄存器同时进行某种相同的操作（比如说 xor、and 等等）;`IFMA` 则代表一种专门的 SIMD 操作：52-bit 多精度整数乘法。

具体而言，`AVX512-IFMA` 有两个指令： `vpmadd52luq` 和 `vpmadd52huq`,它们每个 lane 做的事情可以粗略理解为：

<v-click>

```c
dst += low_52_bits(a * b)
dst += high_52_bits(a * b)
```

也就是取每个 lane 64 bit 的低 52 bit，做乘法操作会得到 104 bit，将高 52 bit 和低 52 bit 直接相加得到结果。

而 AVX512 有 8 个 lane，也就是一条指令可以同时做 8 次这样的操作。

</v-click>

<v-click>

这个指令作为论文的 building block，用于优化前面的所有六个 primitive.

但实际上，论文并没有完整用满这 52-bit，而是每个 lane 仅用了 48-bit，而 $48 \times 8 = 384 > 381$，刚好能装下一个 field element。另一个好处是，如果一个 lane 装满 52-bit，对这个 lane 进行加法操作时有可能超过 IFMA 乘法允许的 52-bit 输入范围，在下次乘法前需要把进位传给更高位的 limb，反而损失性能。

</v-click>

---

## Case Study: $\mathbb{F}_{p^{12}}$ cyclotomic squaring

<CyclotomicSquaringFlow />

---

### Easy part

<CyclotomicSquaringFlow focus="easy" />

---

根据 Miller loop 的定义，其输出 $f \in \mathbb{F}_{p^{12}}^*$，并且我们需要计算 $f^{(p^{12}-1)/r}$。$p^{12}-1$ 的因式分解为：

$$p^{12}-1=(p^6+1)(p^6-1)=(p^2+1)(p^4-p^2+1)(p^6-1)$$

<v-click>

所以：

$$\frac{p^{12}-1}{r}=(p^6-1)(p^2+1) \frac{p^4-p^2+1}{r}$$

</v-click>

<v-click>

对于前两者，也就是计算 $f^{p^6-1}$ 或者 $f^{p^2+1}$，Frobenius automorphism 告诉我们 $(a+b)^{p^k}=a^{p^k}+b^{p^k}$，因此乘方的复杂度相比直接展开更低。

</v-click>

<v-click>

具体而言，我们先计算 $h=f^{p^6-1}=f^{p^6}f^{-1}$，后者涉及到一次比较昂贵的 $\mathbb{F}_{p^{12}}$ 求逆。然后再做 $g=h^{p^2}h$，即可得到 $g=f^{(p^6-1)(p^2+1)}$ 的结果。总之我们仅仅用了**两次 Frobenius，两次乘法和一次求逆**就完成了前两者操作。（论文中的 easy part）

</v-click>

<v-click>

同时，由于 $\text{ord}(g) \mid (p^4-p^2+1)$，同时我们知道 $\Phi_6(X)=X^2-X+1$，令 $X=p^2$，便容易理解 $g \in G_{\Phi_6}(\mathbb{F}_{p^2})$，也就是接下来的运算是在分圆子群进行的。（论文中的 hard part）

</v-click>

---

### Hard part

<CyclotomicSquaringFlow focus="hard" />

---

针对 hard part 的第一个问题，就是 $r$ 的值是不是任意的一个能整除 $p^4-p^2+1$ 的一个整数？答案是否定的。

<v-click>

事实上，我们将要计算的式子 $g^E, \ E=\frac{p^4-p^2+1}{r}$ 中的 $p$ 和 $r$ 都是前文中提到的 BLS12-381 曲线的 seed $z$ 生成，$z$ 的具体值为 `−0xd201000000010000`。具体而言，$p$ 和 $r$ 满足：

$$
r=r(z)=z^4-z^2+1=\Phi_{12}(z) \qquad p=p(z)=\frac{(z-1)^2 r}{3}+z
$$

</v-click>

<v-click>

通过代数恒等变换，我们可以得到 HHT 公式 [^1]：

$$
3E=(z-1)^2(z+p)(z^2+p^2-1)+3
$$

</v-click>

<v-click>

由于 $z \equiv 1 \pmod 3$，实际上也可以写成 $E=\frac{(z-1)^2}{3}(z+p)(z^2+p^2-1)+1$。但实际上 $\frac{(z-1)^2}{3}$ 的 Hamming weight 过大，因此 HHT 选择直接计算前文 easy part 的结果 $g^{3E}$，没有开立方。

</v-click>

<v-click>

注意这里并不影响 pairing 的正确性——由于 $\gcd(3,r)=1$，所以 pairing 映射 $e_{\mathrm{OATE}}(Q,P) \rightarrow e_{\mathrm{OATE}}(Q,P)^3$ 是自同构，仍满足 pairing 相关性质并被密码学正常使用。

</v-click>



[^1]: https://eprint.iacr.org/2020/875

---

总之，最终问题便可转化为对求 $x^z, x^{z^2}, x^p, x^{p^2}$ 以及 $x^{-1}$ 的运算操作。

<v-click>

- 对于 $x^p, x^{p^2}$，与前文相同，可以用 Frobenius 较为快速地计算；

</v-click>    

<v-click>

- $x^{-1}$ 中的 $x$ 满足 $x^{p^4-p^2+1}=1$，故 $x^{p^6+1}=(x^{p^4-p^2+1})^{p^2+1}=1$，即 $x^{-1}=x^{p^6}$，本质上还是 Frobenius。

</v-click>

<v-click>

- 然后就是 $x^z,x^{z^2}$ 了。由于 $z=-\left(
2^{63}+2^{62}+2^{60}+2^{57}+2^{48}+2^{16}
\right)$，是一个负数。我们先计算 $x^{|z|}$ 然后做一下上一步的 inversion 即可。

</v-click>

<v-click>

具体而言：

$$
x^{|z|}=x^{2^{63}}x^{2^{62}}x^{2^{60}}x^{2^{57}}x^{2^{48}}x^{2^{16}}
$$

也就是做一次 $x^{|z|}$，成本是 63 次 cyclotomic squaring 操作和 5 次 multiplication 操作，自然前者就成了论文优化的最重要瓶颈。

> 这就是为什么要让 $z$ 的 Hamming weight 尽量小，主要是为了减少 multiplication 的操作次数。

</v-click>

<v-click>

为了优化 cyclotomic squaring 本身，也一个高效的公式叫 Granger-Scott 公式，这便是下一个部分的内容。

</v-click>


---

### Granger–Scott

<CyclotomicSquaringFlow focus="granger-scott" />

---

在上一节中，主要耗时的原语是对元素 $g$ 反复做 cyclotomic squaring 操作，即映射：

$$
g\longmapsto g^2,
\qquad
g\in G_{\Phi_6}(\mathbb F_{p^2})
\subset \mathbb F_{p^{12}}^*.
$$

<v-click>

当我们令 $q=p^2$ [^1]，则 $G_{\Phi_6}(\mathbb F_{p^2}) = G_{\Phi_6}(\mathbb F_q)$，后者刚好是 Granger–Scott 原工作的对象 [^2]。具体而言，Granger–Scott 公式选择的扩域视角为 $\mathbb F_q \subset \mathbb F_{q^2} \subset \mathbb F_{q^6}$。

</v-click>

<v-click>

首先考虑第一个二次扩张，通常的构造方式是 $\mathbb{F}_{q^2}=\mathbb{F}_q[v]/(v^2-\xi)$，这里 $\xi \in \mathbb{F}_q$ 是非二次剩余。这个域的每个元素是形如 $x=a+bv$ 的形式，我们计算平方操作：

$$
x^2=(a+bv)^2=(a^2+\xi b^2)+2abv
$$

</v-click>

<v-click>

特别地，计算 $p$ 次方等同于共轭。由二次扩域的性质可得 $v^q=-v$，则：

$$
x^q=(a+bv)^q=a+bv^q=a-bv=\bar{x}
$$

无需乘法或者平方操作。

</v-click>

[^1]: 记住这个等式，接下来会反复用到，我不会再明说
[^2]: https://eprint.iacr.org/2009/565


---

下一步就是从 $\mathbb F_{q^2}$ 跳跃到 $\mathbb F_{q^6}$，我们构造三次扩域：

$$
\mathbb F_{q^6} = \mathbb F_{q^2}[w]/(w^3-v)
$$

其中 $g=a+bw+cw^2, \quad a,b,c\in\mathbb F_{q^2}$，同时也有 $w^3=v$。

<v-click>

回到我们的目标，$\mathbb F_{q^{6}}$ 的平方操作。先普通展开平方：

$$
\begin{aligned}
g^2
&=(a+bw+cw^2)^2 \\
&=a^2+2abw+(b^2+2ac)w^2+2bcw^3+c^2w^4
\end{aligned}
$$

</v-click>

<v-click>

利用 $w^3=v$ 这个关系，可以将 $w^3,w^4$ 规约回 $\{1,w\}$，得到形如 $A+Bw+Cw^2$ 的形式，系数为：

$$
A=a^2+2vbc,\quad B=2ab+vc^2,\quad C=b^2+2ac. 
$$

</v-click>

<v-click>

直接这样计算就要做三次乘方和三次乘法，不够划算，所以要想办法消掉这里的交叉项 $ab,ac,bc$。当然这里还没有利用 $g \in G_{\Phi_6}(\mathbb F_{q})$ 这个特殊性质。注意到该条件等价于：

$$
g \in G_{\Phi_6}(\mathbb F_{q}) \Longleftrightarrow g^{q^2-q+1}=1 \Longleftrightarrow g^{q^2}g=g^q
$$

我们代入 $g=a+bw+cw^2$，展开并计算 $g^{q^2}g$ 和 $g^q$ 的常数项相同是否能推出代数关系。

</v-click>

---

我们设 $\omega=w^{q-1}=\frac{w^q}{w}$，则 $\omega^3=(\frac{w^q}{w})^3=\frac{v^q}{v}=-1$，因此 $\omega^6=1$。

<v-click>

如果 $\omega=-1$，否则 $w^q=-w$ 会推出 $w^{q^2}=(-w)^q=-w^q=w$，从而 $w \in \mathbb{F}_{q^2}$，与 $w$ 用来生成三次扩张 $\mathbb{F}_{q^6} / \mathbb{F}_{q^2}$ 矛盾！

而之前已经算出 $\omega^3=-1$，6 的非平凡因子只有 2 和 3，$w$ 不是本原的 2 次或 3 次单位根，因此只能是 6 次。

</v-click>

<v-click>

然后我们证明 $\omega \in \mathbb{F}_q$，由于 $q = p^2 \equiv 1 \pmod 6$，所以 $6 \mid q-1$。而 $\mathbb{F}_q^*$ 是阶为 $q-1$ 的循环群，因此一定包含六次单位根 $\omega$。

</v-click>

<v-click>

回到计算 $g^q,g^{q^2}$ 的常数项本身，由于 $\omega \in \mathbb{F}_q$，可得 $\omega^q=\omega$。而前文定义 $w^q=\omega w$，故 $w^{q^2}=\omega^qw^q=\omega^2 w$。则：

$$
g^q=(a+bw+cw^2)^q=\bar{a}+\bar{b}\omega w+\bar{c} \omega^2w^2
$$

$$
g^{q^2}=(a+bw+cw^2)^{q^2}=a+b\omega^2 w+c \omega^4w^2
$$

</v-click>

<v-click>

计算 $g^{q^2}g = (a+b\omega^2 w+c \omega^4w^2)(a+bw+cw^2)$ 的常数项（注意变量是 $w$，利用 $w^3=v$ 这个关系）：

$$
a \times a = a^2, \quad (b\omega^2 w)(cw^2)=vbc \omega^2, \quad (\omega^4w^2)(bw)=vbc \omega^4
$$

</v-click>

---

由于 $\omega$ 是本原六次单位根，$\omega^4+\omega^2+1=0$，故：

$$
a^2+vbc \omega^2+vbc \omega^4=a^2+vbc(\omega^4+\omega^2)= a^2-vbc
$$

<v-click>

也就是 $g^{q^2}g$ 的常数项是 $a^2-vbc$，而上一页已经推出 $g^q$ 的常数项是 $\bar{a}$，故我们推出了第一个恒等式：

$$
\boxed{vbc=a^2-\bar{a}}
$$

</v-click>

<v-click>

刚才那个恒等式只是常数项相等推出来的关系，对于 $w$ 和 $w^2$ 的系数相等的关系，我们也可以推出剩下两个：

$$
\boxed{ab = vc^2 + \bar{b}, \quad ac = b^2 - \bar{c}}
$$

</v-click>

<v-click>

我们带回之前的平方公式结果 $A+Bw+Cw^2$ 对应的系数：

$$
A=a^2+2vbc,\quad B=2ab+vc^2,\quad C=b^2+2ac. 
$$

就可以消去交叉项，得到最终的 Granger-Scott 公式：

$$
\boxed{A = 3a^2-2\bar{a}, \quad B = 3vc^2+2\bar{b}, \quad C = 3b^2 - 2\bar{c}.}
$$

</v-click>

---

### Cost

<CyclotomicSquaringFlow focus="cost" />

---

上一节我们通过推导 Granger-Scott 公式，把 cyclotomic squaring 中的三次平方和三次乘法操作，减少到仅有的三次 $\mathbb{F}_{q^2}=\mathbb{F}_{p^4}$ 的平方操作，也就是给出 $a,b,c \in \mathbb{F}_{p^4}$，求 $a^2, b^2, c^2$.

<v-click>

为了方便，我们记在 $\mathbb{F}_{p^k}$ 的平方操作代价 $S_k$，乘法操作代价为 $M_k$，所以一次 cyclotomic squaring 的代价就是 $3S_4$。而前文我们推导出在这个扩域 $\mathbb{F}_{q^2}=\mathbb{F}_q[v]/(v^2-\xi)$ 中：

</v-click>

<v-click>

$$
x^2=(a+bv)^2=(a^2+\xi b^2)+2abv
$$

</v-click>

<v-click>

也就是一次 $S_4=2S_2+M_2$，那么整个成本就是 $3S_4=6S_2+3M_2$。假如我们要计算 $x_1^2, x_2^2, x_3^2$，我们可以把这九个“真正的计算”列成三行：

$$
a_1^2, \qquad b_1^2, \qquad a_1b_1
$$

$$
a_2^2, \qquad b_2^2, \qquad a_2b_2
$$

$$
a_3^2, \qquad b_3^2, \qquad a_3b_3
$$

</v-click>

<v-click>

接下来面临的就是一个工程问题了，也马上进入本文真正的 contribution：

 这三个 $\mathbb{F}_{p^4}$ squaring 数量是奇数，怎样把它们放进 AVX-512 的并行布局里，尽量不浪费 lanes？

</v-click>

---

### Hybrid vectorization

<CyclotomicSquaringFlow focus="hybrid" />

---

我们定义 $(w \times x \times y \times z)-\text{way}$ 表示在一个 $\mathbb{F}_{p^4}$ 层的操作：

- 同时计算 $w$ 个 $\mathbb{F}_{p^4}$ 操作；
- 每一个 $\mathbb{F}_{p^4}$ 操作内，同时计算 $x$ 个 $\mathbb{F}_{p^2}$ 操作；
- 每一个 $\mathbb{F}_{p^2}$ 操作内，同时计算 $y$ 个 $\mathbb{F}_{p}$ 操作；
- 每一个 $\mathbb{F}_{p}$ 操作内，同时使用 $z$ 个 64-bit SIMD lanes；
- 同时保证 $wxyz=8$，因为一个 ZMM 寄存器有 $8$ 个 64-bit SIMD lanes.

<v-click>

然而我们看到，前面的乘法操作是 $3S_4$，并不是 1/2/4/8 中的任意一个数，不能完整地填满整个 ZMM 寄存器。因此作者提出了一种名为 **hybrid vectorization** 的新技术，简而言之就是**在某一个计算 level**，将某些结构相似的算式绑定在一起向量化，而让剩下的那一个做标量乘法。

</v-click>

<v-click>

首先拿 Granger-Scott 这一层（也就是最上面那一层）为例。我们有三种路径 $A,B,C$:

$$
\boxed{A = 3a^2-2\bar{a}, \quad B = 3vc^2+2\bar{b}, \quad C = 3b^2 - 2\bar{c}.}
$$

</v-click>

<v-click>

式子 $A$ 只涉及到了 $a$ 自身，而 $B$ 和 $C$ 有一种对 $b,c$ 的轮换感。所以 Cheng 选择将 $B,C$ 这两个合并在一起进行 SIMD 运算。

</v-click>

---

现在我们考虑 $(B,C)$ 联合计算的情况，也就是最高层的 Granger-Scott squaring，对应公式：

$$
B = 3c^2v+2\bar{b}, \qquad C=3b^2-2\bar{c}
$$

<v-click>

可以抽象为以下伪代码（对应了 $(w,x,y,z)$ 四元组的 $w=2$）：

```
Function: CYC_SQR_BC_2WAY(b, c)
Input: b, c ∈ F_{p^4}

(tb, tc) ← SQR_FP4_2WAY(b, c)
(B, C) ← 3·(v·tc, tb) + 2·(conj(b), −conj(c))

Output: (B, C)
```

</v-click>

<v-click>

对于另一个 $A$，就直接计算一个标量的 squaring 即可，对应 $A$ 这边的 $w=1$：

```
Function: CYC_SQR_A_1WAY(a)
Input: a ∈ F_{p^4}

ta ← SQR_FP4_1WAY(a)
A ← 3·ta − 2·conj(a)

Output: A
```

</v-click>

---

然后考虑下面一层，也就是 $\mathbb{F}_{p^2} \to \mathbb{F}_{p^4}$，即 $\mathbb{F}_{p^4}$ squaring，扩域为 $\mathbb{F}_{q^2}=\mathbb{F}_q[v]/(v^2-\xi)$。

<v-click>

在第四节我们讲过，$x^2=(a^2+\xi b^2)+2abv$，真正的成本就是这三部分的计算：

$$
a_0^2, \qquad b_0^2, \qquad a_0b_0
$$

</v-click>

<v-click>

思路与上面那个 cyclotomic squaring 一致，我们显然要将 $a_0^2, b_0^2$ 同时做 SIMD，然后留 $a_0, b_0$ 做 scalar。上一层 square $(B,C)$ 部分的伪代码如下：

</v-click>

<v-click>

```
Function: SQR_FP4_2WAY(b, c)
Input:
    b = b0 + b1·v ∈ F_{p^4}
    c = c0 + c1·v ∈ F_{p^4}

(sb0, sb1, sc0, sc1)
    ← SQR_FP2_4WAY(b0, b1, c0, c1)

(mb, mc)
    ← MUL_FP2_2WAY((b0, b1), (c0, c1))

tb ← (sb0 + ξ·sb1) + (2·mb)·v
tc ← (sc0 + ξ·sc1) + (2·mc)·v

Output: (tb, tc)
```

</v-click>

---

对于上一层的标量部分，也就处理单独 $A$ 路径中 $a^2$ 部分，对应以下代码：

<v-click>

```
Function: SQR_FP4_1WAY(a)
Input: a = a0 + a1·v ∈ F_{p^4}

(s0, s1) ← SQR_FP2_2WAY(a0, a1)
m        ← MUL_FP2_1WAY(a0, a1)

ta ← (s0 + ξ·s1) + (2·m)·v

Output: ta
```

</v-click>

<v-click>

现在我们就来到了 $\mathbb{F}_{p} \to \mathbb{F}_{p^2}$ 这一层，相当于分裂成了四个原语：

- 前者 `SQR_FP4_2WAY` 需要进一步实现 `SQR_FP2_4WAY` 和 `MUL_FP2_2WAY`；
- 后者 `SQR_FP4_1WAY` 则需要实现 `SQR_FP2_2WAY` 和 `MUL_FP2_1WAY`。

</v-click>

<v-click>

这里作者为了简化，并没有真的去逐一写出四个原语的实现，而是统一为实现 `SQR_FP2_*WAY` 和 `MUL_FP2_*WAY`。

区别只是同时喂进去多少组输入，以及每个 $\mathbb{F}_p$ 运算占几个 lanes。

</v-click>

---

首先考虑简单一点的 `SQR_FP2_*WAY`。数学方面，设 $\alpha_0,\; \alpha_1 \in \mathbb{F_p}, \; u^2=-1$，则 $\mathbb{F}_{p^2}$ 的元素则可表示为 $\alpha_0 + \alpha_1 u$，平方展开为：

$$
(\alpha_0 + \alpha_1 u)^2 = (\alpha_0 + \alpha_1)(\alpha_0 - \alpha_1) + (2\alpha_0\alpha_1)u
$$

<v-click>

也就是我们令输出 $r_0 = \alpha_0^2 - \alpha_1^2,\; r_1 = 2\alpha_0\alpha_1$ 即可。

</v-click>

<v-click>

SIMD 实现方面，假如同时做 $j=4$ 个元素的乘法，那么输入为 $\alpha_0^{(j)},\; \alpha_1^{(j)}$，我们也可以得到输出就是 $r_0^{(j)} = (\alpha_0^{(j)} + \alpha_1^{(j)})(\alpha_0^{(j)} - \alpha_1^{(j)}),\; r_1^{(j)} = 2\alpha_0^{(j)}\alpha_1^{(j)}$，并可立即写出 SIMD 伪代码：

</v-click>

<v-click>

```
Function: SQR_FP2_4WAY(α^(1), ..., α^(4))
Input: α^(j) = α_0^(j) + α_1^(j)·u ∈ F_{p^2}

(t_0^(1), ..., t_0^(4)) ← (α_0^(1)+α_1^(1), ..., α_0^(4)+α_1^(4))
(t_1^(1), ..., t_1^(4)) ← (α_0^(1)−α_1^(1), ..., α_0^(4)−α_1^(4))

(r0^(1), r1^(1), ..., r0^(4), r1^(4))
    ← MUL_FP_8WAY((t0^(1), 2α_0^(1), ..., t0^(4), 2α_0^(4)),
                  (t1^(1),  α_1^(1), ..., t1^(4),  α_1^(4)))

Output: r^(j) = r_0^(j) + r_1^(j)·u,  j = 1, ..., 4
```

</v-click>

---

然后考虑 `MUL_FP2_*WAY`。这里有两个元素 $\alpha=\alpha_0+\alpha_1 u, \beta=\beta_0+\beta_1 u$，做标量乘法得：

$$
\alpha\beta=(\alpha_0\beta_0-\alpha_1\beta_1)+(\alpha_0\beta_1+\alpha_1\beta_0)u
$$

暴露了四个独立的 multiplication。将其向量化就是 $p_0^{(j)}=\alpha_0^{(j)}\beta_0^{(j)}, p_1^{(j)}=\alpha_1^{(j)}\beta_1^{(j)}, p_2^{(j)}=\alpha_0^{(j)}\beta_1^{(j)}, p_3^{(j)}=\alpha_1^{(j)}\beta_0^{(j)}$。当 $j=2$ 时，代码如下：

```
Function: MUL_FP2_2WAY(α^(1), β^(1), α^(2), β^(2))
Input:
    α^(j) = α_0^(j) + α_1^(j)·u ∈ F_{p^2}
    β^(j) = β_0^(j) + β_1^(j)·u ∈ F_{p^2}

(p_0^(1), p_1^(1), p_2^(1), p_3^(1),
 p_0^(2), p_1^(2), p_2^(2), p_3^(2))
    ← MUL_FP_8WAY(                      // 竖着看
        (α_0^(1), α_1^(1), α_0^(1), α_1^(1), α_0^(2), α_1^(2), α_0^(2), α_1^(2)),
        (β_0^(1), β_1^(1), β_1^(1), β_0^(1), β_0^(2), β_1^(2), β_1^(2), β_0^(2))
    )

Output:
    r^(j) = (p_0^(j) − p_1^(j))
          + (p_2^(j) + p_3^(j))·u,  j = 1, 2
```

---

总结一下，我们可以把 cyclotomic squaring 操作的几个函数的调用关系图画为：

```
Cyclotomic squaring                                             [(w,x,y,z)]
|
+-- w=2 --> CYC_SQR_BC_2WAY(b,c)
|            `--> SQR_FP4_2WAY(b,c)
|                 +-- x=2 --> SQR_FP2_4WAY(b_0,b_1,c_0,c_1)          [wx=4]
|                 |            `-- y=2  --> MUL_FP_8WAY(...)    [(2,2,2,1)]
|                 |                              
|                 |
|                 `-- x=1 --> MUL_FP2_2WAY(b_0,b_1,c_0,c_1)          [wx=2]
|                              `-- y=4  --> MUL_FP_8WAY(...)    [(2,1,4,1)]
|
`-- w=1 --> CYC_SQR_A_1WAY(a)
             `--> SQR_FP4_1WAY(a)
                  +-- x=2 --> SQR_FP2_2WAY(a_0,a_1)                  [wx=2]
                  |            `-- y=2  --> MUL_FP_4x2WAY(...)  [(1,2,2,2)]
                  |
                  `-- x=1 --> MUL_FP2_1WAY(a_0,a_1)                  [wx=1]
                               `-- y=4  --> MUL_FP_4x2WAY(...)  [(1,1,4,2)]
                                       
```

这个问题最终被抽象成了 `MUL_FP_8WAY` 和 `MUL_FP_4x2WAY` 在具体 SIMD 上的实现，也就是下一节的内容。

---

### IFMA / 48-bit limb

<CyclotomicSquaringFlow focus="ifma" />

---

在正式讲这两个函数之前，我们先了解一下，SIMD 在具体的硬件中是如何进行加法和乘法操作的。假如我们要同时操作 8 个 381-bit 的数 $a^{(j)}$，$j=1 \cdots 8$。注意这里的 $a^{(j)}$ 不是整体存放在一个 ZMM 寄存器中，而是把每个 $a^{(j)}$ 的 48 位切片，从低到高依次存放到 `ZMM A_0` 到 `ZMM A_7` 中，如图所示：

<v-click>

```
                     8 个并行任务 / SIMD lanes
                 (1)      (2)      (3)            (8)

ZMM A_0, limb 0  a_0^(1)  a_0^(2)  a_0^(3)  ...  a_0^(8)
ZMM A_1, limb 1  a_1^(1)  a_1^(2)  a_1^(3)  ...  a_1^(8)
ZMM A_2, limb 2  a_2^(1)  a_2^(2)  a_2^(3)  ...  a_2^(8)
...
ZMM A_7, limb 7  a_7^(1)  a_7^(2)  a_7^(3)  ...  a_7^(8)
```

</v-click>

<v-click>

如果我们要同时计算 $a^{(j)}$ 与 $b^{(j)}$ 这 $8+8=16$ 个数的加法（假设 $b^{(j)}$ 被分别存放在 `ZMM B_0` 到 `ZMM B_7` 中），SIMD 会使用 `C_0 ← VPADDQ(A_0, B_0)` 计算出低 48 位的结果 `C_0`，进位会被丢弃。

</v-click>

<v-click>

然后执行以下步骤之后，就完成了同时对 $a^{(j)}$ 和 $b^{(j)}$ 这 $8+8=16$ 个数的加法操作：

```
C_0 ← VPADDQ(A_0, B_0)   C_0 ← A_0 + B_0
C_1 ← VPADDQ(A_1, B_1)   C_1 ← A_1 + B_1
...
C_7 ← VPADDQ(A_7, B_7)   C_7 ← A_7 + B_7
```

</v-click>

---

那可能有同学会问：那为什么要搞这么麻烦，每个元素存一个 ZMM 寄存器，ZMM 直接相加不也能实现同样的 8 次 `VPADDQ` 操作吗？

<v-click>

答案也确实如此。但如果是要做乘法操作，就不是那么简单了。我们先介绍“官方的 SIMD 乘法操作”：

</v-click>

<v-click>

由于乘法本质上也可以写成卷积的形式，需要将两个乘数的每一个 limb 执行乘法指令，一共要执行 $8 \times 8 = 64$ 次。举一个例子，假如选择 limb $i=0, j=3$，也就是选出了这两行：

```
A_0 = | a_0^(1) | a_0^(2) | ... | a_0^(8) |                     B_3 = | b_3^(1) | b_3^(2) | ... | b_3^(8) |
```

</v-click>

<v-click>

那么执行一条向量乘法：

```
P_3 ← IFMA(A_0, B_3)
```

会得到：

```
P_3   = | a_0^(1)b_3^(1) | a_0^(2)b_3^(2) | ... | a_0^(8)b_3^(8) |
```

</v-click>

<v-click>

当然 48-bit 的乘法结果肯定会超出 limb 的 64-bit 范围，因次实际上这个指令由两个 intrinsic 完成：`vpmadd52luq` `vpmadd52huq`，分别对应做 52-bit 的乘法，保留结果的低 52 位和高 52 位。

</v-click>

---

对于乘法局部结果 $P_k$，我们需要通过 IFMA 指令来做卷积：

$$P_k = \sum_{i+j=k} \; \text{IFMA}(A_i, B_j)$$

<v-click>

其中 $0 \le k \le 14$，对应 limb 0-14，进位的话分布在 limb 1-15，所以处理进位之后，把这 16 个 limb 从低到高拼起来即可同时得到 8 个元素的乘法结果。

> 注意到在 `AVX512-IFMA` 指令集中，程序员可见的 ZMM 寄存器有 32 个，而 $8+8+16=32$，所以做 8 个 $\mathbb{F}_p$ 乘法刚好够用。

</v-click>

<v-click>

回到之前的问题：现在如果还使用“每个元素存一个 ZMM 寄存器”的存放方案，还可以方便实现乘法吗？

这个问题留作课后思考。

</v-click>

---



---

## 六个 primitive 的优化选择

| Primitive | 公式 / 方法 | 向量化思路 |
|---|---|---|
| `cyclotomic_sqr_fp12` | Granger–Scott | Hybrid：单独计算 $A$；把 $B,C$ 合并做 2-way $\mathbb{F}_{p^4}$ 平方。 |
| `mul_fp12` | Karatsuba | Hybrid：两个 $\mathbb{F}_{p^6}$ 乘法并行；第三个乘法单独做 1-way。 |
| `mul_by_xy00z0_fp12` | 稀疏 schoolbook | 在 $\mathbb{F}_{p^2}$ 层做 4-way；两个稀疏 $\mathbb{F}_{p^6}$ 乘法并行。 |
| `sqr_fp12` | Karatsuba | 在 $\mathbb{F}_{p^2}$ 层做 4-way；复用 2-way $\mathbb{F}_{p^6}$ 乘法 kernel。 |
| `line_dbl` | `dbl-2009-l` | 在 $\mathbb{F}_{p^2}$ 层做 4-way；提高 point doubling 与 line computation 的 lane 利用率。 |
| `line_add` | `madd-2007-bl` | 在 $\mathbb{F}_{p^2}$ 层做 2-way；用于 sparse $\mathbb{F}_{p^{12}}$ multiplication 之前。 |

---

## Evaluation: high-level primitives

<div class="text-sm text-gray-500 mb-4">
Intel Core i3-1005G1 (Ice Lake), GCC 13.3, <code>-O3</code>, TurboBoost disabled · baseline: scalar x64 assembly in blst
</div>

| Operation | blst cycles | avxbls cycles | Speed-up |
|---|---:|---:|---:|
| $\mathbb{F}_{p^{12}}$ cyclotomic squaring | 3,313 | 1,789 | **1.85×** |
| $\mathbb{F}_{p^{12}}$ compressed cyclotomic squaring | 2,346 | 1,088 | **2.16×** |
| $\mathbb{F}_{p^{12}}$ multiplication | 7,653 | 4,074 | **1.88×** |
| $\mathbb{F}_{p^{12}}$ sparse multiplication | 5,057 | 2,373 | **2.13×** |
| $\mathbb{F}_{p^{12}}$ squaring | 5,456 | 2,412 | **2.26×** |
| `line_dbl` | 4,127 | 2,141 | **1.93×** |
| `line_add` | 5,293 | 3,125 | **1.69×** |

<!-- <div class="mt-3 text-center text-lg">
所有目标原语均获得 <strong>1.69×–2.26×</strong> 加速
</div> -->

---

## Evaluation: end-to-end pairing

<div class="text-sm text-gray-500 mb-6">
Cycles on Intel Core i3-1005G1 · speed-up relative to the original scalar blst Granger–Scott baseline
</div>

| Computation | blst | avxbls | Speed-up |
|---|---:|---:|---:|
| Miller loop | 1,003,400 | 499,393 | **2.01×** |
| Final exponentiation (Granger–Scott) | 1,349,003 | 762,186 | **1.77×** |
| Final exponentiation (compressed) | 1,169,728 | 694,729 | **1.94×** |
| Full pairing (Granger–Scott) | 2,351,615 | 1,265,314 | **1.86×** |
| Full pairing (compressed) | 2,169,338 | 1,195,236 | **1.97×** |

<div class="grid grid-cols-2 gap-8 mt-7 text-center">
  <div>
    <div class="text-4xl font-bold text-blue-600">1.86×</div>
    <div class="mt-1">Granger–Scott full pairing</div>
  </div>
  <div>
    <div class="text-4xl font-bold text-red-600">1.97×</div>
    <div class="mt-1">compressed full pairing</div>
  </div>
</div>

---

## Discussion

<div class="grid grid-cols-2 gap-10 mt-8">

<div>

### 有效之处

- 微基准中的加速能够传递到完整 pairing。
- Miller loop 达到 **2.01×** 加速，接近各个优化 primitive 的加速区间。
- Compressed cyclotomic squaring 省去了系数 $A$，使其加速比从 **1.85×** 提升到 **2.16×**。
- 使用 compressed cyclotomic squaring 后，完整 pairing 相比对应的标量基线快 **1.97×**。

</div>

<div>

### 为什么不是 8×？

- 并行性往往只存在于更底层的 $\mathbb{F}_p$ 或 $\mathbb{F}_{p^2}$ 运算中。
- Tower field 中的模约减和向量布局转换会引入额外开销。
- Hybrid kernel 中包含效率较低的 $(4\times2)$-way $\mathbb{F}_p$ 算术。
- `line_add` 在 $\mathbb{F}_{p^2}$ 层只能提供 2-way 并行。

</div>

</div>

<div class="mt-10 border-t pt-4 text-center text-lg">
结论：这是一个接近 <strong>2×</strong> 的 latency optimization，但其收益依赖 AVX-512IFMA，适用平台仍然有限。
</div>
