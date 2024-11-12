# PlaceHolder

---

## Perfect secrecy

DEF: A cipher $(E, D)$ over $(\mathcal{K}, \mathcal{M}, \mathcal{C})$ has **perfect secrecy** if:

$$\forall m_0, m_1 \in \mathcal{M}, len(m_0) = len(m_1) \land \forall c \in \mathcal{C}$$

$$ Pr[E(k, m_0) = c] = Pr[E(k, m_1) = c] $$

where $k$ is uniform in $\mathcal{K}$, i.e. ($k \overset{R}{\leftarrow} \mathcal{K}$)

<v-click>

The bad news is to satisfy this condition, we must have $|\mathcal{K}| \ge |\mathcal{M}|$, which makes it hard to use in practice.

As we have learned eariler, OTP (One-Time-Pad) is an example of cipher scheme which satisfies perfect secrecy.

</v-click>

<v-click>

QUESTION: Let $\mathcal{M} = \mathcal{C} = \mathcal{K} = \{0, 1, 2, ..., 255\}$ and consider the following cipher defined over $(\mathcal{K}, \mathcal{M}, \mathcal{C})$

$$ E(k,m) = m + k \pmod {256}; D(k, c) = c - k \pmod {256} $$

Does this cipher have perfect secrecy?

</v-click>

---

## Pseudo random generator (PRG)

So what will happen if we expand the ciphertext from OTP? Then it comes to the PRG:

<v-click>

DEF: In *Foundations of Cryptography: Basic Tools, page 113*, we define pseudo random generator $G$ as this:

> A pseudorandom generator is a deterministic polynomial-time algorithm $G$ satisfying the following 2 conditions:
>
> 1. There exists a function $l: \mathbb{N} \rightarrow \mathbb{N} \text{ s.t. } \forall n \in \mathbb{N}, l(n) > n \text{ and }  \forall s \in \{0, 1\}^*,  |G(s)| = l(|s|)$
> 2. Pseudorandomness: The ensemble $\{G(U_n)\}_{n \in \mathbb{N}}$ is pseudorandom (unpreditable). 
>
> The function $l$ is called the expansion factor of $G$, and the input $s$ to the generator is called its seed.

</v-click>

<v-click>

One practical example of PRG is stream cipher, like RC4 and Salsa20, while the former one is found to have bias in initial output. 

Anyone intrested in this, please see details in paper *Statistical Analysis of the Alleged RC4 Keystream Generator, FSE 2001*.

</v-click>

---

## Predictability (Pseudorandomness)

As I said eariler, it is not practical to construct an encryption scheme which satisfies perfect secrecy. However, that doesn't mean an encryption scheme which doesn't have perfect secrecy is not secure, due to the limited power of adversary in practice.

To address security in cryptography, we need to clarify a set of security defnitions such as predictability and distinguishability (in the next slide):

<v-click>

DEF: We say that $G: K \rightarrow \{0,1\}^n$ is **predictable** if:

$$ \exists \text{eff alg. } A \text{ and } \exists_{0 \le i \le n-1} \text { s.t.}$$

$$ Pr_{k \overset{R}{\leftarrow} \mathcal{K}}[A(G(k))|_{1,...,i} = G(k)|_{i+1}] > \frac{1}{2} + \varepsilon $$

for non-negligible $\varepsilon$ (e.g. $\varepsilon = \frac{1}{2^{30}}$)

DEF: PRG is unpreditable if it is not predictable.

</v-click>

---

## Semantic Security (Indistinguishability)

![](semantic.png)

DEF: $E$ is semantically secure if for all efficient adversary $A$, $Adv_{ss}[A,E]$ is negeligible.

---

![alt text](image.png)

---

![alt text](image-1.png)

---

![alt text](image-2.png)

---

## PRF and PRP

In previous slides we discussed about PRG, which is widely used in block ciphers. Next we'll introduce PRF (pseudo random function) and PRP (pseudo random permutation).

<v-click>

PRF is defined over $(K, X, Y)$:

$$ F: K \times X \rightarrow Y $$

such that exists "eff" algorithm to evalutate $F(k,x)$.

</v-click>

<v-click>

PRP is defined over $(K, X)$:

$$ E: K \times X \rightarrow X $$

such that:

1. exists "eff" **deterministic** algorithm to evalutate $E(k,x)$.
2. $E(k, \cdot)$ is one-to-one, and exists "eff" inversion algorithm $D(k,y)$.

</v-click>

<v-click>

QUESTION: PRF can construct PRG easily, please provide an example.

</v-click>

---

Security requirements of PRF (*Introduction to Modern Cryptography, page 79*):

![alt text](image-3.png)

Security requirements of PRP (*Introduction to Modern Cryptography, page 80*):

![alt text](image-4.png)

---

![alt text](image-5.png)