/* Physics Dark Room - Web App build
   Converted from the WeChat Mini Program version.
*/

const webStorage = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(key)); } catch (e) { return null; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) {}
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch (e) {}
  }
};

function showOverlay({ title = '', content = '', buttons = [] }) {
  const root = document.getElementById('modal-root');
  root.innerHTML = '';
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  const box = document.createElement('div');
  box.className = 'modal-box';
  if (title) {
    const h = document.createElement('div');
    h.className = 'modal-title';
    h.textContent = title;
    box.appendChild(h);
  }
  if (content) {
    const p = document.createElement('div');
    p.className = 'modal-content';
    p.textContent = content;
    box.appendChild(p);
  }
  const actions = document.createElement('div');
  actions.className = 'modal-actions';
  buttons.forEach((button) => {
    const b = document.createElement('button');
    b.className = button.primary ? 'modal-button primary' : 'modal-button';
    b.textContent = button.text;
    b.addEventListener('click', () => {
      root.innerHTML = '';
      if (button.onClick) button.onClick();
    });
    actions.appendChild(b);
  });
  box.appendChild(actions);
  overlay.appendChild(box);
  root.appendChild(overlay);
}

const wx = {
  getStorageSync(key) { return webStorage.get(key); },
  setStorageSync(key, value) { webStorage.set(key, value); },
  removeStorageSync(key) { webStorage.remove(key); },
  showModal({ title, content, confirmText = 'OK', success }) {
    showOverlay({
      title,
      content,
      buttons: [{ text: confirmText, primary: true, onClick: () => success && success({ confirm: true }) }]
    });
  },
  showActionSheet({ itemList = [], success }) {
    showOverlay({
      title: document.body.dataset.lang === 'en' ? 'Restart Options' : '重新开始',
      buttons: itemList.map((text, index) => ({
        text,
        primary: index === 0,
        onClick: () => success && success({ tapIndex: index })
      })).concat([{ text: document.body.dataset.lang === 'en' ? 'Cancel' : '取消' }])
    });
  }
};

let miniProgramPage = null;
function Page(config) {
  miniProgramPage = config;
}

const STORAGE_KEY = 'physics_darkroom_v4'

// --- 资源系统常量 ---
const BASE_MAX_ENERGY = 10
const ENERGY_PER_CHAPTER = 2
const REST_ENERGY_MIN = 4
const REST_ENERGY_MAX = 9
const ACTION_ENERGY_COST = 1
const THEORY_ENERGY_COST = 2
const DOUBT_LOCK = 5
const INSIGHT_SPARK = 3
const INSIGHT_REQUIRE = 2

function text(zh, en) {
  return { zh, en }
}

function pick(value, lang) {
  if (typeof value === 'string') return value
  return value[lang] || value.zh
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

const UI = {
  reset: text('重新开始', 'Restart'),
  resetChapter: text('重开本章节', 'Restart Chapter'),
  resetAll: text('完全重新开始', 'Restart All'),
  lang: text('English', '中文'),
  concepts: text('已建立的概念', 'Concepts'),
  log: text('暗室手记', 'Dark Room Journal'),
  complete: text('完成', 'Complete'),
  day: text('', 'Round '),
  roundSuffix: text('轮', ''),
  kinds: {
    theory: text('判断', 'Theory'),
    experiment: text('实验', 'Experiment'),
    misconception: text('判断', 'Misconception'),
    rest: text('休整', 'Rest')
  },
  resources: {
    energy: text('精力', 'Energy'),
    notes: text('手稿', 'Notes'),
    insight: text('灵感', 'Insight'),
    doubt: text('困惑', 'Doubt')
  },
  lowEnergy: text('精力不足，需要休息恢复', 'Low energy. Rest to recover.'),
  insightLocked: text('（需要灵感 ≥ 2）', '(Requires Insight ≥ 2)'),
  doubtConfused: text('困惑缠身，思路不清……休息一下或许有帮助。', 'Too confused to think clearly... Perhaps rest will help.'),
  insightSpark: text('灵光乍现！你隐约看到了一条新的路径。', 'A spark of insight! You glimpse a new path forward.'),
  completeTitle: text('物理学的发展之路', 'The Path of Physics Development'),
  completeScene: text(
    '暗室不再只是暗室。桌上有小车、磁针、灯丝、热机、棱镜、原子核和一张写满概率的纸。',
    'The dark room is no longer merely dark. On the table lie carts, a compass, a filament, a heat engine, a prism, a nucleus, and a page covered in probability.'
  ),
  completeGoal: text(
    '你走完了一条物理史主线：从苹果和月亮，到电机、无线电、热、声、光、时空、量子和核能。最后的问题不再是"能不能做到"，而是"该怎样使用"。',
    'You have followed one central path through physics: from the apple and the Moon to motors, radio, heat, sound, light, spacetime, quanta, and nuclear energy. The final question is no longer whether it can be done, but how it should be used.'
  )
}

const START_STATE = {
  lang: 'zh',
  chapter: 0,
  maxEnergy: BASE_MAX_ENERGY,
  energy: BASE_MAX_ENERGY,
  day: 1,
  records: 0,
  insight: 0,
  doubt: 1,
  predictions: 0,
  facts: {},
  laws: {},
  complete: false,
  feedback: null,
  logs: [
    {
      time: 0,
      text: text(
        '窗外啪嗒一声。苹果落地，月亮还挂在天上。桌上的小车像在等你发问。',
        'Outside, an apple drops to the ground. The Moon still hangs overhead. The little cart on the table seems to be waiting for your question.'
      )
    }
  ]
}
const CHAPTERS = [
  {
    title: text('落体与惯性', 'Falling Bodies and Inertia'),
    label: text('第一问', 'Q1'),
    question: text(
      '苹果会落下。问题不是“它落下了”，而是：运动会不会自己改变？',
      'An apple falls. The question is not simply that it falls. The real question is whether motion changes on its own.'
    ),
    scene: text(
      '窗外啪嗒一声，苹果落地。暗室的桌上摆着一颗石子、一块木片，还有一段可以搭成斜面的木板。你翻开空白的笔记本，写下第一个问题：为什么物体会往下落？',
      'Outside, an apple drops. On the dark room table lie a stone, a wooden block, and a plank that can form a slope. You open a blank notebook and write the first question: why do things fall?'
    )
  },
  {
    title: text('力与质量', 'Force, Mass, and Acceleration'),
    label: text('第二问', 'Q2'),
    question: text(
      '如果物体会保持原状，那么力到底改变了什么？质量又为什么重要？',
      'If objects tend to keep their state of motion, what exactly does a force change? And why does mass matter?'
    ),
    scene: text(
      '一辆小车停在桌面上。旁边放着不同重量的砝码，还有一把可以计时的滴漏。上一次你发现了惯性，现在你要搞清楚：力到底改变了什么？',
      'A cart sits on the table. Beside it are weights of different sizes and a water clock for timing. Last time you discovered inertia; now you must figure out: what exactly does force change?'
    )
  },
  {
    title: text('相互作用', 'Action and Reaction'),
    label: text('第三问', 'Q3'),
    question: text(
      '一个物体推另一个物体时，力是单向的吗？',
      'When one object pushes another, is the force only one-way?'
    ),
    scene: text(
      '两辆小车面对面停在桌上，中间夹着一根弹簧。你推一辆车去撞另一辆——它们都动了。力是不是从来就不是单方面的？',
      'Two carts face each other with a spring between them. You push one into the other — both move. Is force never one-sided?'
    )
  },
  {
    title: text('月亮为什么一直落不下来', 'Why Does the Moon Keep Missing Earth?'),
    label: text('第四问', 'Q4'),
    question: text(
      '苹果落向地面，月亮却绕着地球。它们可能是同一种运动吗？',
      'The apple falls toward Earth, and the Moon circles Earth. Could both be forms of falling?'
    ),
    scene: text(
      '桌上摊开一张星图。你已经弄清了地面上的运动规律。现在抬头看天：月亮每晚的位置都在变，却从不掉下来。它也在“下落”吗？',
      'A star chart is spread on the table. You have figured out the laws of motion on Earth. Now look up: the Moon changes position every night yet never falls. Is it also “falling”?'
    )
  },
  {
    title: text('写成原理', 'Writing the Principles'),
    label: text('收束', 'Closure'),
    question: text(
      '现在，地上的运动和天上的运动能否共用一套语言？',
      'Can motion on Earth and motion in the heavens be described by the same laws?'
    ),
    scene: text(
      '你的笔记本已经写满了实验记录。三条运动定律、万有引力——它们拼在一起，像一幅终于合拢的拼图。是时候把它们写成一套完整的理论了。',
      'Your notebook is filled with experiments. Three laws of motion, universal gravitation — they fit together like a puzzle finally complete. Time to write them as one theory.'
    )
  },
  {
    title: text('看不见的吸引', 'Invisible Electric Attraction'),
    label: text('第五问', 'Q5'),
    question: text(
      '琥珀摩擦之后会吸起纸屑。这是力吗？如果是，为什么不用接触也能发生？',
      'After amber is rubbed, it attracts scraps of paper. Is this a force? If so, how can it act without contact?'
    ),
    scene: text(
      '力学的大厦刚刚落成，桌上就出现了新的东西：一块琥珀、一张毛皮、几片薄纸。摩擦之后，纸屑被吸了起来——不接触也能产生力。经典力学解释不了这个。',
      'The edifice of mechanics is barely complete when new items appear: amber, fur, paper scraps. After rubbing, the paper rises — a force without contact. Classical mechanics cannot explain this.'
    )
  },
  {
    title: text('电流与磁针', 'Current and the Compass'),
    label: text('第六问', 'Q6'),
    question: text(
      '电流经过导线时，旁边的磁针会偏转。电和磁真的互不相干吗？',
      'When current flows through a wire, a nearby compass needle turns. Are electricity and magnetism really separate?'
    ),
    scene: text(
      '桌上多了一节电池、一根导线和一枚指南针。你把导线接通，磁针微微偏了一下。电和磁——两个看似无关的现象——在暗室里第一次打了招呼。',
      'A battery, a wire, and a compass join the table. You connect the circuit, and the needle twitches. Electricity and magnetism — two seemingly unrelated phenomena — greet each other for the first time.'
    )
  },
  {
    title: text('线圈里的电', 'Current in the Coil'),
    label: text('第七问', 'Q7'),
    question: text(
      '磁铁不接触线圈，却能让感应电流出现。到底是磁铁本身，还是变化在起作用？',
      'A magnet can induce a current in a coil without touching it. Is the magnet itself enough, or is change the key?'
    ),
    scene: text(
      '线圈安静地躺在桌上。你把磁铁插进去——电流表的指针跳了一下。拔出来——又跳了一下。磁铁不动的时候，什么也不发生。变化才是关键。',
      'A coil lies still on the table. You push a magnet in — the meter jumps. Pull it out — it jumps again. When the magnet stays still, nothing happens. Change is the key.'
    )
  },
  {
    title: text('场与光', 'Fields and Light'),
    label: text('第八问', 'Q8'),
    question: text(
      '如果变化的电场能产生磁场，变化的磁场能产生电场，那么它们会不会一起向外传播？',
      'If a changing electric field can produce a magnetic field, and a changing magnetic field can produce an electric field, can the two propagate outward together?'
    ),
    scene: text(
      '电生磁，磁生电。你把这两条规律放在一起，发现它们可以互相激发，像波浪一样向外传播。算一下这个波的速度——和光速一模一样。光，难道就是电磁波？',
      'Electricity creates magnetism, magnetism creates electricity. Put them together and they can ripple outward like a wave. Calculate the speed — it matches the speed of light exactly. Could light be an electromagnetic wave?'
    )
  },
  {
    title: text('电的机器', 'Electrical Machines'),
    label: text('第九问', 'Q9'),
    question: text(
      '如果电流能产生磁效应，变化的磁场能感应电流，能不能让它们替人做功？',
      'If electric currents can produce magnetic effects, and changing magnetic fields can induce currents, can we make them do useful work?'
    ),
    scene: text(
      '理论已经完备。桌上多了线圈、铁芯和转轴。法拉第让线圈在磁场中转了起来，电能变成了机械运动。反过来转，机械运动又变成了电。电力时代的蓝图就在这张桌上。',
      'Theory is complete. Coils, iron cores, and axles appear. Faraday makes a coil spin in a magnetic field — electricity becomes motion. Spin it the other way, and motion becomes electricity. The blueprint of the electric age lies on this table.'
    )
  },
  {
    title: text('无线电', 'Radio Communication'),
    label: text('第十问', 'Q10'),
    question: text(
      '麦克斯韦说电磁波会传播。它能不能离开导线，把消息带到远处？',
      'Maxwell’s theory says electromagnetic waves can travel. Can they leave a wire and carry messages across distance?'
    ),
    scene: text(
      '火花在间隙里啪地跳过。赫兹证明了电磁波真的存在。现在马可尼想把信息压进这些波里，让它们飞过海面。信息第一次可以不用导线传递了。',
      'A spark snaps across a gap. Hertz proved EM waves are real. Now Marconi wants to encode messages into these waves and send them across the sea. For the first time, information can travel without wires.'
    )
  },
  {
    title: text('热与功', 'Heat and Work'),
    label: text('第十一问', 'Q11'),
    question: text(
      '蒸汽能推动活塞。热到底是一种东西，还是运动和能量的另一种面孔？',
      'Steam can push a piston. Is heat a substance, or is it another face of motion and energy?'
    ),
    scene: text(
      '水壶里的蒸汽顶起壶盖，热变成了运动。但热到底是什么？是一种叫“热质”的流体，还是能量的一种形式？焦耳在旁边摇动桨叶，准备用实验来回答。',
      'Steam lifts the kettle lid — heat becomes motion. But what is heat? A fluid called “caloric”, or a form of energy? Joule is nearby, turning a paddle, ready to answer with an experiment.'
    )
  },
  {
    title: text('熵与方向', 'Entropy and the Arrow of Time'),
    label: text('第十二问', 'Q12'),
    question: text(
      '能量守恒了，为什么热机还是会浪费？为什么时间好像只往一个方向流？',
      'If energy is conserved, why do heat engines still waste energy as heat? And why does time seem to have only one direction?'
    ),
    scene: text(
      '能量不会消失，但热机永远不能把热全部变成功。总有一部分散失到环境中。卡诺画出了理想循环，克劳修斯写下了一个新词：熵。它决定了时间的方向。',
      'Energy is never lost, but no engine can turn all heat into work. Some always escapes. Carnot draws the ideal cycle, and Clausius writes a new word: entropy. It gives time its direction.'
    )
  },
  {
    title: text('声音的形状', 'The Shape of Sound'),
    label: text('第十三问', 'Q13'),
    question: text(
      '声音会不会也是一种波？如果是，波动的究竟是什么？',
      'Could sound be a wave too? If so, what is actually vibrating?'
    ),
    scene: text(
      '音叉在手里振动，声音传到耳朵。但声音是怎么过来的？敲一下音叉，撒着细沙的金属板上出现了花纹——声音有形状。空气不再是空的，它是声音的路。',
      'A tuning fork vibrates, and sound reaches your ear. But how? Strike the fork, and sand on a metal plate forms patterns — sound has shape. Air is no longer empty; it is the road sound travels.'
    )
  },
  {
    title: text('光的路', 'The Path of Light'),
    label: text('第十四问', 'Q14'),
    question: text(
      '光会折射、成像、分色、干涉。它是粒子、波，还是更奇怪的东西？',
      'Light refracts, forms images, disperses into colors, and interferes. Is it made of particles, waves, or something stranger?'
    ),
    scene: text(
      '棱镜把白光拆成彩虹，透镜把远景拉到眼前，杨氏双缝在墙上留下明暗条纹。光的行为有时候像粒子，有时候像波——你得把两种证据都收集起来。',
      'A prism splits white light into a rainbow, a lens brings distant scenes close, and Young’s double slit leaves bright and dark bands on the wall. Light acts like particles sometimes, like waves other times — gather evidence for both.'
    )
  },
  {
    title: text('追不上光', 'Chasing a Beam of Light'),
    label: text('第十五问', 'Q15'),
    question: text(
      '如果你追着一束光跑，会不会看到一束静止的光？',
      'If you chase a beam of light, could you ever see it frozen in place?'
    ),
    scene: text(
      '按照常识，跑得够快就能追上任何东西。但迈克耳孙和莫雷转动干涉仪，光速纹丝不动。不管你朝哪个方向、跑得多快，光速永远不变。这意味着时间和空间不是绝对的。',
      'Common sense says run fast enough and you can catch anything. But Michelson and Morley rotate their interferometer, and the speed of light refuses to budge. No matter your direction or speed, light speed is constant. This means time and space are not absolute.'
    )
  },
  {
    title: text('弯曲的时空', 'Curved Spacetime'),
    label: text('第十六问', 'Q16'),
    question: text(
      '如果引力不是一只看不见的手，而是时空本身弯了呢？',
      'What if gravity is not an invisible hand, but the curvature of spacetime itself?'
    ),
    scene: text(
      '想象你在一部自由下落的电梯里，感觉不到自己的重量。爱因斯坦说：引力不是力，而是时空被质量弯曲后的几何效应。太阳弯曲了周围的时空，行星只是沿着弯曲的路径走。',
      'Imagine falling freely in an elevator — you feel weightless. Einstein says gravity is not a force, but the curvature of spacetime caused by mass. The Sun bends spacetime around it; planets simply follow curved paths.'
    )
  },
  {
    title: text('原子有内部', 'Inside the Atom'),
    label: text('第十七问', 'Q17'),
    question: text(
      '原子真的是不可分的硬球吗？如果不是，里面藏着什么？',
      'Is the atom truly an indivisible hard sphere? If not, what is hidden inside?'
    ),
    scene: text(
      '阴极射线在玻璃管里发光。汤姆孙发现了一种比原子还轻一千多倍的粒子——电子。原子不是最小的。用α粒子轰击金箔，大部分穿了过去，少数被猛地弹回——原子内部几乎是空的，中心有一个极小的核。',
      'Cathode rays glow in a glass tube. Thomson discovers a particle over a thousand times lighter than an atom — the electron. Atoms are not the smallest. Bombard gold foil with alpha particles: most pass through, a few bounce back violently — atoms are mostly empty, with a tiny dense nucleus.'
    )
  },
  {
    title: text('能量一份一份', 'Energy in Packets'),
    label: text('第十八问', 'Q18'),
    question: text(
      '热辐射和金属表面的电子都不肯按经典物理行动。能量会不会不是连续的？',
      'Thermal radiation and the photoelectric effect refuse to obey classical physics. Could energy come in discrete packets?'
    ),
    scene: text(
      '烧红的铁块发出特定颜色的光，经典公式在高频端完全失效。用很亮的红光照金属，打不出电子；用微弱的紫光照，电子却飞了出来。普朗克和爱因斯坦提出：能量不是连续的，而是一份一份的量子。',
      'A hot iron glows with specific colors, and the classical formula fails at high frequencies. Bright red light cannot knock electrons off metal; faint violet light can. Planck and Einstein propose: energy is not continuous, but comes in discrete quanta.'
    )
  },
  {
    title: text('概率的原子', 'Atoms and Probability'),
    label: text('第十九问', 'Q19'),
    question: text(
      '电子到底在哪里？它是绕核转的小行星，还是一团只能计算概率的波？',
      'Where exactly is the electron? Is it a tiny planet orbiting the nucleus, or a wave described by probability?'
    ),
    scene: text(
      '氢原子只发出特定颜色的光，像原子的指纹。德布罗意说电子也有波长，薛定谔写下了波函数方程，海森堡发现你越想精确测量位置，动量就越不确定。原子世界由概率和不确定性支配。',
      'Hydrogen emits only specific colors — atomic fingerprints. de Broglie says electrons have wavelengths, Schrödinger writes the wave equation, and Heisenberg finds that the more precisely you measure position, the less you know about momentum. The atomic world is ruled by probability and uncertainty.'
    )
  },
  {
    title: text('核火', 'Nuclear Fire'),
    label: text('第二十问', 'Q20'),
    question: text(
      '如果原子核也能改变，释放出来的能量会把世界带到哪里？',
      'If atomic nuclei can change too, where will the energy they release take the world?'
    ),
    scene: text(
      '云室里细线划过——那是放射性粒子留下的轨迹。用中子轰击铀核，它裂成两块，释放出更多中子。链式反应像火一样蔓延。同一条方程，可以点亮城市，也可以毁灭城市。物理学走到了人类选择的十字路口。',
      'Thin tracks cross a cloud chamber — traces of radioactive particles. Bombard uranium with neutrons, and it splits, releasing more neutrons. A chain reaction spreads like fire. The same equation can light cities or destroy them. Physics arrives at a crossroads of human choice.'
    )
  }
]
const ACTIONS = [
  {
    id: 'watch_apple',
    type: 'experiment',
    chapter: 0,
    label: text('观察苹果：它怎么落下来的？', 'Watch the Apple: How Does It Fall?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.apple = true
      return text(
        '苹果落下，没有转弯，也没有犹豫。你在纸上写：它总是奔向地面。',
        'The apple falls without turning or hesitating. You write: it always moves toward the ground.'
      )
    }
  },
  {
    id: 'compare_objects',
    type: 'experiment',
    chapter: 0,
    label: text('比较不同物体：石子、木块也这样落吗？', 'Compare: Do Stone and Wood Fall the Same?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.manyFall = true
      return text(
        '石子、木块、苹果都往下走。原来不是苹果听话，是整个房间都偏向地面。',
        'A stone, a wooden block, and an apple all move downward. Apples are not special; the whole room seems tilted toward Earth.'
      )
    }
  },
  {
    id: 'build_slope',
    type: 'experiment',
    chapter: 0,
    label: text('搭一个斜面：把下落变慢，仔细看', 'Build an Inclined Plane: Slow Down the Fall'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.manyFall,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.slope = true
      return text(
        '斜面把下落拖慢了。运动像被摊开的纸条，终于能一格一格数清。',
        'The inclined plane slows the fall down. Motion becomes a strip of paper you can count square by square.'
      )
    }
  },
  {
    id: 'wrong_weight',
    type: 'misconception',
    chapter: 0,
    label: text('草率下结论：重的东西落得更快？', 'Jump to Conclusion: Heavier = Faster?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple && !s.facts.manyFall,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：你还只看过苹果。先比较别的物体，否则“重物更快”只是顺手猜的。',
        'Counterexample: you have only watched the apple. Compare other objects first; otherwise, "heavier objects fall faster" is only a guess.'
      )
      return text(
        '你写下“重的更快”。纸面很安静，像是在等第二个物体来反驳。',
        'You write, "heavier means faster." The page stays quiet, as if waiting for another object to answer back.'
      )
    }
  },
  {
    id: 'wrong_direction_only',
    type: 'misconception',
    chapter: 0,
    label: text('仓促推论：都往下落就够了吗？', 'Hasty Conclusion: Is Direction Enough?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.manyFall && !s.facts.slope,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：石子和木块都向下，只说明方向相同。要判断运动会不会自己改变，还得把运动放慢。',
        'Counterexample: stone and wood both fall downward, but that only tells you the direction. To judge whether motion changes on its own, you need to slow the motion down.'
      )
      return text(
        '你差点把“都向下”当成完整解释。可是方向只是线索，还不是定律。',
        'You almost treat "they all go down" as a full explanation. Direction is a clue, not a law.'
      )
    }
  },
  {
    id: 'law_inertia',
    type: 'theory',
    chapter: 0,
    label: text('提出新概念：物体不受力时保持静止或匀速直线运动', 'Propose: Objects at rest stay at rest; objects in motion stay in motion'),
    hint: text('精力1 需：斜面 记录3 思路1', 'Focus 1; requires: inclined plane, Notes 3, Insight 1'),
    cost: 1,
    requires: (s) => s.facts.slope && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.inertia = true
      s.chapter = 1
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下第一条规则：没人打扰时，物体会坚持原来的样子。静止如此，匀速也如此。',
        'You discover the first law of motion: unless acted on by a net external force, an object remains at rest or continues moving with constant velocity in a straight line.'
      )
    }
  },
  {
    id: 'push_cart',
    type: 'experiment',
    chapter: 1,
    label: text('轻推小车：力是怎样改变运动的？', 'Nudge the Cart: How Does Force Change Motion?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.push = true
      return text(
        '你轻推小车。它没有“想通”，只是被迫改变。力第一次露出手。',
        'You nudge the cart. It does not make a choice; it is forced to change. Force shows its hand for the first time.'
      )
    }
  },
  {
    id: 'wrong_push_forever',
    type: 'misconception',
    chapter: 1,
    label: text('错误直觉：物体运动必须一直有力推着？', 'Misconception: Does Motion Require Continuous Force?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：手离开后，小车仍会滑行。力也许不是“维持运动”，而是“改变运动”。',
        'Counterexample: after your hand leaves, the cart still glides. Force may not be what maintains motion; it may be what changes motion.'
      )
      return text(
        '你猜小车必须一直被推才会运动。可是它离手后还滑了一段，像是在反驳你。',
        'You guess the cart must be pushed continuously to move. But after your hand leaves, it still glides on, arguing back.'
      )
    }
  },
  {
    id: 'vary_force',
    type: 'experiment',
    chapter: 1,
    label: text('改变推力：力越大，运动变化越快吗？', 'Vary the Force: More Force = Faster Change?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.forceChange = true
      return text(
        '推得越狠，小车变速越快。你盯着那种“变快的快”，给它留了个位置。',
        'The harder the push, the faster the cart’s speed changes. You make room in your notes for acceleration.'
      )
    }
  },
  {
    id: 'add_mass',
    type: 'experiment',
    chapter: 1,
    label: text('给小车加重：质量大了，同样的力效果一样吗？', 'Add Mass: Same Force, Different Effect?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.mass = true
      return text(
        '小车变重后开始固执。同样一推，它像在说：改变我，没那么容易。',
        'With more mass, the cart becomes stubborn. The same push now seems to say: changing me will not be so easy.'
      )
    }
  },
  {
    id: 'invent_calculus',
    type: 'experiment',
    chapter: 1,
    label: text('精确测量：把时间切成无限薄的瞬间', 'Slice Time: Measure Change at Each Instant'),
    hint: text('精力2 -> 思路1 预言1', 'Focus 2 -> Insight +1, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.forceChange && s.facts.mass,
    once: true,
    run(s) {
      s.insight += 1
      s.predictions += 1
      s.facts.calculus = true
      return text(
        '你把时间切成越来越薄的片。速度不再只是“前后差多少”，而成了每一瞬间的变化。',
        'You slice time into thinner and thinner moments. Speed is no longer just a before-and-after difference; it becomes change at an instant.'
      )
    }
  },
  {
    id: 'wrong_average_only',
    type: 'misconception',
    chapter: 1,
    label: text('偷懒：只看平均速度够不够？', 'Shortcut: Is Average Velocity Enough?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && !s.facts.calculus,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：平均速度会把一段运动抹平。要描述力怎样改变运动，你需要看每一瞬间的变化。',
        'Counterexample: average speed smooths a whole motion into one number. To describe how force changes motion, you need the change at each instant.'
      )
      return text(
        '你试着只用平均速度解释小车。纸上的曲线变得模糊，像被手掌抹过。',
        'You try to explain the cart using only average speed. The curve on the page blurs, as if wiped by a hand.'
      )
    }
  },
  {
    id: 'law_second',
    type: 'theory',
    chapter: 1,
    label: text('提出新概念：力等于质量乘以加速度，F=ma', 'Propose: Force = mass × acceleration, F=ma'),
    hint: text('精力1 需：推力 质量 微积分 记录4 思路2', 'Focus 1; requires: force, mass, calculus, Notes 4, Insight 2'),
    cost: 1,
    requires: (s) => s.facts.forceChange && s.facts.mass && s.facts.calculus && s.records >= 4 && s.insight >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 2
      s.laws.second = true
      s.chapter = 2
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '借着微积分，你抓住了每一瞬间的加速度。力、质量和变化被锁进一行：F = ma。',
        'With calculus, you describe acceleration at each instant. Net force, mass, and acceleration lock into one line: F = ma.'
      )
    }
  },
  {
    id: 'collide_carts',
    type: 'experiment',
    chapter: 2,
    label: text('碰撞实验：两辆小车相撞，各自怎么动？', 'Collision: What Happens to Both Carts?'),
    hint: text('精力2 -> 记录2', 'Focus 2 -> Notes +2'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.facts.collision = true
      return text(
        '两辆小车撞在一起。一个被推出去，另一个也狼狈地退回。力没有独角戏。',
        'Two carts collide. One is pushed away; the other rolls back. Force is never a solo act.'
      )
    }
  },
  {
    id: 'wrong_one_way_force',
    type: 'misconception',
    chapter: 2,
    label: text('错误直觉：力是单向的，只有一方受力？', 'Misconception: Is Force One-Sided?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.collision && !s.facts.rope,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：被撞的小车动了，撞它的小车也退了。力的箭头少画了一半。',
        'Counterexample: the struck cart moves, and the striking cart rolls back. Half the force arrows are missing.'
      )
      return text(
        '你把箭头只画向一边。小车退回来的痕迹提醒你：另一个箭头被你漏掉了。',
        'You draw the arrow only one way. The cart rolling back reminds you: you missed the other arrow.'
      )
    }
  },
  {
    id: 'pull_rope',
    type: 'experiment',
    chapter: 2,
    label: text('拉绳实验：你拉绳，绳也拉你吗？', 'Pull a Rope: Does It Pull You Back?'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.rope = true
      return text(
        '你拉绳，绳也拉你。你忽然觉得，世界从来不允许单方面动手。',
        'You pull the rope, and the rope pulls you back. The world does not allow one-sided action.'
      )
    }
  },
  {
    id: 'measure_pair_force',
    type: 'experiment',
    chapter: 2,
    label: text('精确测量：绳子两端的力一样大吗？', 'Measure: Are Forces at Both Ends Equal?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.rope,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.equalPair = true
      return text(
        '你在绳子两端各接一个弹簧秤。两边读数一起抖动，最后停在同一个数上。',
        'You attach a spring scale to each end of the rope. Both readings tremble, then settle on the same number.'
      )
    }
  },
  {
    id: 'wrong_pair_not_equal',
    type: 'misconception',
    chapter: 2,
    label: text('错误直觉：反作用力应该小一些？', 'Misconception: Is the Reaction Weaker?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.rope && !s.facts.equalPair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只知道力成对还不够。你需要比较两端大小，否则“反作用力较小”只是直觉。',
        'Counterexample: knowing forces come in pairs is not enough. Compare both ends, or "the reaction is weaker" is only intuition.'
      )
      return text(
        '你写下“反作用力也许小一些”。绳子绷得笔直，像在要求你量一量再说。',
        'You write, "maybe the reaction is weaker." The taut rope seems to demand a measurement.'
      )
    }
  },
  {
    id: 'law_third',
    type: 'theory',
    chapter: 2,
    label: text('提出新概念：作用力与反作用力大小相等、方向相反', 'Propose: Equal and opposite reaction'),
    hint: text('精力1 需：碰撞 拉绳 两端相等 记录5 思路1', 'Focus 1; requires: collision, rope, equal readings, Notes 5, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.equalPair,
    requires: (s) => s.facts.collision && s.facts.rope && s.facts.equalPair && s.records >= 5 && s.insight >= 1,
    run(s) {
      s.records -= 5
      s.insight -= 1
      s.laws.third = true
      s.chapter = 3
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下第三条规则：两个物体相互作用时，力大小相等、方向相反，分别作用在彼此身上。',
        'You discover the third law of motion: when two objects interact, they exert equal and opposite forces on each other.'
      )
    }
  },
  {
    id: 'read_moon',
    type: 'experiment',
    chapter: 3,
    label: text('观察月亮：它每晚位置都在变，为什么不掉下来？', 'Study the Moon: Why Does It Not Fall?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.moon = true
      return text(
        '月亮每晚都换一点方向，却始终不肯离开。它像一辆永远错过地面的车。',
        'Each night the Moon changes direction, yet it never escapes. It is like a cart that keeps missing the ground.'
      )
    }
  },
  {
    id: 'wrong_moon_free',
    type: 'misconception',
    chapter: 3,
    label: text('错误直觉：月亮在天上，所以它没有在下落？', 'Misconception: The Moon Is Not Falling?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.moon,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：月亮的方向每晚都在变。它不是不下落，而是一直错过地面。',
        'Counterexample: the Moon changes direction every night. It is not refusing to fall; it keeps missing Earth.'
      )
      return text(
        '你写下“月亮没有下落”。星图上的弯曲轨迹却轻轻敲了敲桌面。',
        'You write, "the Moon is not falling." The curved path on the star chart quietly taps the table.'
      )
    }
  },
  {
    id: 'estimate_curve',
    type: 'experiment',
    chapter: 3,
    label: text('计算月亮的弯曲：它每秒“掉”多少？', 'Calculate: How Much Does the Moon “Fall”?'),
    hint: text('精力2 -> 预言1 思路1', 'Focus 2 -> Prediction +1, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.moon,
    once: true,
    run(s) {
      s.predictions += 1
      s.insight += 1
      s.facts.curve = true
      return text(
        '你画出月亮的弯路：它确实在下落，只是速度太横，总把地面错过去。',
        'You draw the Moon’s path: it is falling, but its sideways speed keeps making it miss Earth.'
      )
    }
  },
  {
    id: 'compare_earth_sky',
    type: 'experiment',
    chapter: 3,
    label: text('关键比较：苹果的下落和月亮的“下落”是同一回事吗？', 'Key Comparison: Same Force for Apple and Moon?'),
    hint: text('精力2 -> 预言1 记录1', 'Focus 2 -> Prediction +1, Notes +1'),
    cost: 2,
    requires: (s) => s.facts.curve && s.laws.second,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.sameGravity = true
      return text(
        '苹果和月亮被放在同一张纸上。一个落到脚边，一个落成轨道。',
        'The apple and the Moon share one page. One falls to your feet; the other falls into orbit.'
      )
    }
  },
  {
    id: 'law_gravity',
    type: 'theory',
    chapter: 3,
    label: text('提出新概念：任何两个物体之间都存在引力，与距离平方成反比', 'Propose: Universal gravitation; force weakens with distance squared'),
    hint: text('精力1 需：地月比较 预言2 思路1', 'Focus 1; requires: Earth–Moon comparison, Predictions 2, Insight 1'),
    cost: 1,
    requires: (s) => s.facts.sameGravity && s.predictions >= 2 && s.insight >= 1,
    run(s) {
      s.predictions -= 2
      s.insight -= 1
      s.laws.gravity = true
      s.chapter = 4
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你提出万有引力：同一种看不见的拉扯，拽住苹果，也拽住月亮。',
        'You propose universal gravitation: every mass attracts every other mass, including both the apple and the Moon.'
      )
    }
  },
  {
    id: 'write_principia',
    type: 'theory',
    chapter: 4,
    label: text('集大成：把三条定律和万有引力写成完整的理论体系', 'Synthesize: Three Laws + Gravity = One System'),
    hint: text('精力1 需：三定律 万有引力 记录2', 'Focus 1; requires: three laws, gravity, Notes 2'),
    cost: 1,
    requires: (s) => s.laws.inertia && s.laws.second && s.laws.third && s.laws.gravity && s.records >= 2,
    run(s) {
      s.records -= 2
      s.laws.principia = true
      s.chapter = 5
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你合上《原理》。地上的碰撞、桌上的小车、天上的月亮，终于说起同一种语言。墙后，磁针轻轻偏了一下。',
        'You close the Principia. Collisions on the floor, carts on the table, and the Moon in the sky finally speak the same language. Behind the wall, a compass needle twitches.'
      )
    }
  },
  {
    id: 'rub_amber',
    type: 'experiment',
    chapter: 5,
    label: text('摩擦琥珀：为什么纸屑会被吸起来？', 'Rub Amber: Why Are Paper Scraps Attracted?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.amber = true
      return text(
        '琥珀擦过毛皮后，纸屑忽然竖起来，像听见了无声的召唤。',
        'After amber is rubbed with fur, paper scraps stand up as if hearing a silent call.'
      )
    }
  },
  {
    id: 'wrong_contact_only',
    type: 'misconception',
    chapter: 5,
    label: text('错误直觉：力必须通过接触才能传递？', 'Misconception: Must Forces Act Through Contact?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.amber && !s.facts.chargePair,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：纸屑还没碰到琥珀就动了。这里也许有一种隔空影响。',
        'Counterexample: the paper moves before touching the amber. Some influence is reaching across space.'
      )
      return text(
        '你写下“必须接触”。纸屑在空中抖了一下，像在嘲笑这句话。',
        'You write, "contact is required." A paper scrap trembles in the air, as if laughing at the sentence.'
      )
    }
  },
  {
    id: 'compare_charges',
    type: 'experiment',
    chapter: 5,
    label: text('比较两种效果：有的吸、有的斥，为什么？', 'Compare: Some Attract, Some Repel — Why?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.amber,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.chargePair = true
      return text(
        '有些东西靠近，有些东西躲开。电不只是“吸引”，它像有两种性格。',
        'Some things draw closer; others move away. Electricity is not just attraction; it seems to have two temperaments.'
      )
    }
  },
  {
    id: 'law_charge',
    type: 'theory',
    chapter: 5,
    label: text('提出新概念：电荷有两种，同种相斥、异种相吸', 'Propose: Two kinds of charge; like repels, unlike attracts'),
    hint: text('精力1 需：吸引排斥 记录3 思路1', 'Focus 1; requires: attraction and repulsion, Notes 3, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.chargePair,
    requires: (s) => s.facts.chargePair && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.charge = true
      s.chapter = 6
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你给这种隔空的电性起了名字：电荷。同类相斥，异类相吸，暗室里多了一种看不见的秩序。',
        'You give this electric property a name: charge. Like repels like; unlike attracts unlike. Another invisible order enters the room.'
      )
    }
  },
  {
    id: 'close_circuit',
    type: 'experiment',
    chapter: 6,
    label: text('接通电路：导线里有什么在流动？', 'Connect the Circuit: What Flows Inside?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.current = true
      return text(
        '导线接上电池，金属没有发光，却像有东西在里面流动。',
        'The wire is connected to the battery. The metal does not glow, yet something seems to flow inside it.'
      )
    }
  },
  {
    id: 'compass_near_wire',
    type: 'experiment',
    chapter: 6,
    label: text('关键实验：通电导线旁边的磁针会动吗？', 'Key Experiment: Does Current Affect a Compass?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.current,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.oersted = true
      return text(
        '电流经过时，磁针偏了一下。电和磁第一次在你面前互相点头。',
        'When current passes, the compass needle turns. Electricity and magnetism acknowledge each other for the first time.'
      )
    }
  },
  {
    id: 'wrong_electric_magnetic_separate',
    type: 'misconception',
    chapter: 6,
    label: text('错误直觉：电和磁是两回事，互不相干？', 'Misconception: Are Electricity and Magnetism Unrelated?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.current && !s.facts.oersted,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：先别急着分开它们。把磁针放到通电导线旁边，看看它会不会沉默。',
        'Counterexample: do not separate them too soon. Put a compass by the current-carrying wire and see if it stays silent.'
      )
      return text(
        '你把电和磁画在两页纸上。磁针还没上场，结论显得太整齐。',
        'You draw electricity and magnetism on two separate pages. The compass has not yet given its evidence.'
      )
    }
  },
  {
    id: 'law_current_magnetism',
    type: 'theory',
    chapter: 6,
    label: text('提出新概念：电流周围会产生磁场，使磁针偏转', 'Propose: Current produces a magnetic field'),
    hint: text('精力1 需：磁针偏转 记录3 思路1', 'Focus 1; requires: compass deflection, Notes 3, Insight 1'),
    cost: 1,
    visible: (s) => s.facts.oersted,
    requires: (s) => s.facts.oersted && s.records >= 3 && s.insight >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.laws.currentMagnetism = true
      s.chapter = 7
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下：电流会产生磁效应。导线周围不再是空的，而像有看不见的旋涡。',
        'You discover that an electric current produces a magnetic field. The space around the wire is no longer empty; it carries a circular magnetic pattern.'
      )
    }
  },
  {
    id: 'move_magnet_coil',
    type: 'experiment',
    chapter: 7,
    label: text('移动磁铁：磁铁穿过线圈会产生电吗？', 'Move a Magnet: Does It Generate Current?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.induction = true
      return text(
        '磁铁一动，线圈里的指针也动。磁似乎能把电从静默里叫醒。',
        'When the magnet moves, the needle connected to the coil moves too. Magnetism seems able to wake electricity from silence.'
      )
    }
  },
  {
    id: 'wrong_static_magnet_current',
    type: 'misconception',
    chapter: 7,
    label: text('错误直觉：磁铁放在线圈旁边就能一直发电？', 'Misconception: Stationary Magnet = Continuous Current?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.induction && !s.facts.changeMatters,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：磁铁停住时，指针也安静下来。这里真正关键的不是磁铁，而是变化。',
        'Counterexample: when the magnet stops, the needle rests too. The key is not the magnet by itself, but change.'
      )
      return text(
        '你把磁铁停在线圈旁边，等电流自己出现。桌面安静得有点尴尬。',
        'You hold the magnet still beside the coil and wait for current. The table becomes awkwardly quiet.'
      )
    }
  },
  {
    id: 'reverse_motion',
    type: 'experiment',
    chapter: 7,
    label: text('反向移动：磁铁反方向动，电流也反向吗？', 'Reverse: Does Opposite Motion Reverse Current?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.induction,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.changeMatters = true
      return text(
        '磁铁反向移动，指针也反向偏转。线圈听见的不是“磁铁”，而是“变化”。',
        'Move the magnet the other way, and the needle turns the other way. The coil does not hear "magnet"; it hears "change."'
      )
    }
  },
  {
    id: 'law_induction',
    type: 'theory',
    chapter: 7,
    label: text('提出新概念：变化的磁场会在闭合线圈中产生感应电流', 'Propose: Changing magnetic field induces current'),
    hint: text('精力1 需：变化 记录3 思路1 预言1', 'Focus 1; requires: change, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.changeMatters,
    requires: (s) => s.facts.changeMatters && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.induction = true
      s.chapter = 8
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下：变化的磁场会生出电流。暗室里第一次出现了“变化产生变化”的味道。',
        'You discover electromagnetic induction: a changing magnetic flux can induce an emf and, in a closed circuit, a current.'
      )
    }
  },
  {
    id: 'draw_fields',
    type: 'experiment',
    chapter: 8,
    label: text('画场线：空间本身有结构吗？', 'Draw Field Lines: Does Space Have Structure?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism && s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fields = true
      return text(
        '你不再只画物体，而开始画空间本身。线条穿过空处，像给看不见的东西铺路。',
        'You stop drawing only objects and begin drawing space itself. Lines cross empty regions like roads for the invisible.'
      )
    }
  },
  {
    id: 'wrong_light_separate',
    type: 'misconception',
    chapter: 8,
    label: text('错误直觉：光和电磁是两回事？', 'Misconception: Is Light Separate from EM?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.fields && !s.facts.lightSpeed,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：把电磁场传播的速度算出来，它太像光速了。这个巧合不肯安静。',
        'Counterexample: calculate the speed of electromagnetic propagation. It looks far too much like the speed of light to stay quiet.'
      )
      return text(
        '你把光单独放到一边。纸上的速度数字却悄悄把它拉回电和磁旁边。',
        'You set light aside. The speed written on the page quietly pulls it back beside electricity and magnetism.'
      )
    }
  },
  {
    id: 'measure_wave_speed',
    type: 'experiment',
    chapter: 8,
    label: text('计算电磁波速度：它和光速一样吗？', 'Calculate: Does EM Wave Speed = Light Speed?'),
    hint: text('精力2 -> 预言2 思路1', 'Focus 2 -> Predictions +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.fields,
    once: true,
    run(s) {
      s.predictions += 2
      s.insight += 1
      s.facts.lightSpeed = true
      return text(
        '你算出场的波动速度。那个数字太熟悉了，像一道光从纸背后照出来。',
        'You calculate the speed of waves in the fields. The number is too familiar, like light shining from behind the page.'
      )
    }
  },
  {
    id: 'law_maxwell',
    type: 'theory',
    chapter: 8,
    label: text('提出新概念：变化的电场和磁场互相激发，以光速传播；光就是电磁波', 'Propose: Maxwell’s equations; light is an EM wave'),
    hint: text('精力1 需：场 光速 记录2 思路2 预言2', 'Focus 1; requires: fields, speed of light, Notes 2, Insight 2, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.lightSpeed,
    requires: (s) => s.facts.fields && s.facts.lightSpeed && s.records >= 2 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 2
      s.insight -= 2
      s.predictions -= 2
      s.laws.maxwell = true
      s.chapter = 9
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下麦克斯韦方程。电和磁互相追逐，自己向外传播；光，原来就是这种追逐的波。桌角的线圈忽然像一台机器。',
        'You write Maxwell’s equations. Changing electric and magnetic fields sustain one another and propagate outward; light is an electromagnetic wave. The coil on the table suddenly looks like a machine.'
      )
    }
  },
  {
    id: 'spin_motor',
    type: 'experiment',
    chapter: 9,
    label: text('造电动机：通电线圈在磁场中会转吗？', 'Build a Motor: Will a Coil Spin in a Field?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.currentMagnetism,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.motor = true
      return text(
        '通电线圈在磁场里转了半圈，又被换向器推着继续转。法拉第的小玩具露出电动机的骨架。',
        'A powered coil turns in a magnetic field, and a commutator pushes it onward. Faraday’s little toy reveals the skeleton of a motor.'
      )
    }
  },
  {
    id: 'wrong_power_free',
    type: 'misconception',
    chapter: 9,
    label: text('错误直觉：电动机凭空产生能量？', 'Misconception: Does a Motor Create Energy?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.motor && !s.facts.generator,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：电动机转得越用力，电池越快疲惫。机器不是凭空给力，而是在交换能量。',
        'Counterexample: the harder the motor works, the faster the battery tires. A machine does not make power from nothing; it trades energy.'
      )
      return text(
        '你差点把转动当成白来的礼物。电池发热的身体提醒你：账总要有人付。',
        'You almost treat rotation as a free gift. The warming battery reminds you that the bill is always paid somewhere.'
      )
    }
  },
  {
    id: 'turn_generator',
    type: 'experiment',
    chapter: 9,
    label: text('造发电机：反过来转线圈能发电吗？', 'Build a Generator: Spin a Coil = Electricity?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.laws.induction,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.generator = true
      return text(
        '你用手转动线圈，电流表醒了。电动机倒过来，竟像发电机；运动和电开始互相兑换。',
        'You turn the coil by hand, and the galvanometer wakes. Run backward, a motor becomes a generator; motion and electricity begin to trade places.'
      )
    }
  },
  {
    id: 'light_filament',
    type: 'experiment',
    chapter: 9,
    label: text('点亮灯泡：电能可以变成光和热', 'Light a Bulb: Electricity Becomes Light and Heat'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.facts.generator,
    once: true,
    run(s) {
      s.records += 1
      s.facts.bulb = true
      return text(
        '细灯丝被电流烧得发白。斯旺和爱迪生都知道：要让城市亮起来，物理还得学会耐用。',
        'The thin filament glows white. Swan and Edison both know: to light a city, physics also has to learn durability.'
      )
    }
  },
  {
    id: 'law_electric_power',
    type: 'theory',
    chapter: 9,
    label: text('提出新概念：发电、输电、用电可以组成完整的电力系统', 'Propose: Generation + Transmission = Power System'),
    hint: text('精力1 需：电机 发电机 灯 记录4 思路1 预言1', 'Focus 1; requires: motor, generator, lamp, Notes 4, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.bulb,
    requires: (s) => s.facts.motor && s.facts.generator && s.facts.bulb && s.records >= 4 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 1
      s.laws.electricPower = true
      s.chapter = 10
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你把电动机、发电机和灯连成一条链：能量可以远距离分配，黑夜第一次显得可以被工程管理。',
        'You link motor, generator, and lamp into one chain: energy can be distributed across distance, and night begins to look like something engineering can manage.'
      )
    }
  },
  {
    id: 'spark_gap',
    type: 'experiment',
    chapter: 10,
    label: text('火花放电：电磁波能被制造出来吗？', 'Make a Spark: Can We Generate EM Waves?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.maxwell,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spark = true
      return text(
        '火花在间隙里啪地跳过。赫兹的装置很小，野心却很大：让麦克斯韦的波真的出现在桌上。',
        'A spark snaps across the gap. Hertz’s apparatus is small, but its ambition is large: make Maxwell’s waves appear on the table.'
      )
    }
  },
  {
    id: 'wrong_wire_needed',
    type: 'misconception',
    chapter: 10,
    label: text('错误直觉：信息必须通过导线才能传递？', 'Misconception: Must Signals Travel Through Wires?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spark && !s.facts.antenna,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：麦克斯韦方程允许波离开导体。先让火花和天线说话，再决定消息能走多远。',
        'Counterexample: Maxwell’s equations allow waves to leave conductors. Let the spark and the antenna speak before deciding how far messages can go.'
      )
      return text(
        '你把消息困在铜线上。火花却像在敲墙，想把声音送到房间外。',
        'You trap the message in copper. The spark taps the wall, trying to send a voice outside the room.'
      )
    }
  },
  {
    id: 'build_antenna',
    type: 'experiment',
    chapter: 10,
    label: text('架设天线：能接收到远处传来的电磁波吗？', 'Raise an Antenna: Can It Receive Distant Waves?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.spark,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.antenna = true
      return text(
        '天线把火花的急促变化抛进空间。看不见的波从导线边缘松手，向外跑去。',
        'The antenna throws the spark’s rapid changes into space. Invisible waves let go of the wire edge and run outward.'
      )
    }
  },
  {
    id: 'tune_receiver',
    type: 'experiment',
    chapter: 10,
    label: text('调谐接收：怎样从众多信号中选出想要的那一个？', 'Tune a Receiver: Pick One Signal from Many'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.antenna,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.radio = true
      return text(
        '接收器只在某个频率上醒来。马可尼的无线电不是魔法，而是让远方的节奏被这里认出。',
        'The receiver wakes only at one frequency. Marconi’s radio is not magic; it lets a far rhythm be recognized here.'
      )
    }
  },
  {
    id: 'law_radio',
    type: 'theory',
    chapter: 10,
    label: text('提出新概念：信息可以通过调制电磁波，跨越空间无线传输', 'Propose: Encode info on EM waves; wireless transmission'),
    hint: text('精力1 需：天线 调谐 记录3 思路1 预言1', 'Focus 1; requires: antenna, tuning, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.radio,
    requires: (s) => s.facts.antenna && s.facts.radio && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.radio = true
      s.chapter = 11
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下无线通信：把信息压进电磁波，再用调谐把它从空气里捞出来。暗室终于能听见远方。',
        'You establish wireless communication: encode information in electromagnetic waves, then recover it by tuning the receiver. The room can finally hear distant voices.'
      )
    }
  },
  {
    id: 'heat_water',
    type: 'experiment',
    chapter: 11,
    label: text('烧水观察：蒸汽顶起壶盖，热变成了什么？', 'Boil Water: Steam Lifts the Lid — What Is Heat?'),
    hint: text('精力1 -> 记录1 疑问1', 'Focus 1 -> Notes +1, Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.steam = true
      return text(
        '水汽顶起壶盖。热没有画箭头，却实实在在把东西推开了。',
        'Steam lifts the lid. Heat draws no arrow on the page, yet it pushes something open.'
      )
    }
  },
  {
    id: 'wrong_caloric',
    type: 'misconception',
    chapter: 11,
    label: text('错误直觉：热是一种叫“热质”的流体？', 'Misconception: Is Heat a Fluid Called “Caloric”?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.steam && !s.facts.joule,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：摩擦和搅拌也能不断生热。热不像一桶会倒空的液体，更像运动被打散后的账本。',
        'Counterexample: friction and stirring can keep making heat. Heat is less like a fluid that empties and more like a ledger of scattered motion.'
      )
      return text(
        '你把热想成一种会流动的东西。水壶没有反对，但桨叶实验还没开始。',
        'You imagine heat as something that flows. The kettle does not object, but the paddle-wheel experiment has not begun.'
      )
    }
  },
  {
    id: 'turn_paddle',
    type: 'experiment',
    chapter: 11,
    label: text('焦耳实验：用桨叶搅水，机械功能变成热吗？', 'Joule’s Experiment: Work into Heat?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.steam,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.joule = true
      return text(
        '桨叶搅动水，温度慢慢升高。焦耳让机械功变成热，像把两本账合成一本。',
        'Paddles churn the water, and the temperature rises. Joule turns mechanical work into heat, merging two accounts into one.'
      )
    }
  },
  {
    id: 'build_heat_engine',
    type: 'experiment',
    chapter: 11,
    label: text('分析蒸汽机：热是怎样推动活塞做功的？', 'Analyze a Steam Engine: How Does Heat Do Work?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.joule,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.engine = true
      return text(
        '热的蒸汽推动活塞，活塞带动飞轮。瓦特的机器把矿井、工厂和城市接进同一个节拍。',
        'Hot steam drives a piston, and the piston turns a flywheel. Watt’s engine pulls mines, factories, and cities into one rhythm.'
      )
    }
  },
  {
    id: 'law_energy',
    type: 'theory',
    chapter: 11,
    label: text('提出新概念：能量既不会创生也不会消失，只能从一种形式转化为另一种', 'Propose: Energy is neither created nor destroyed'),
    hint: text('精力1 需：功热转换 热机 记录3 思路1 预言1', 'Focus 1; requires: work–heat conversion, engine, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.engine,
    requires: (s) => s.facts.joule && s.facts.engine && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.energy = true
      s.chapter = 12
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下能量守恒：功、热、电和运动可以换装，但总账不会凭空增减。',
        'You discover conservation of energy: work, heat, electricity, and motion can transform into one another, but the total energy neither appears from nowhere nor vanishes.'
      )
    }
  },
  {
    id: 'watch_waste_heat',
    type: 'experiment',
    chapter: 12,
    label: text('观察废热：热机为什么总会浪费一部分热量？', 'Observe Waste Heat: Why Always Some Loss?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.energy,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.wasteHeat = true
      return text(
        '热机做了功，也把大量热丢给冷端。能量没丢，可有些能量变得不再好用。',
        'The heat engine does work, yet dumps much heat to the cold side. Energy is not lost, but some of it becomes less useful.'
      )
    }
  },
  {
    id: 'wrong_perpetual_engine',
    type: 'misconception',
    chapter: 12,
    label: text('错误直觉：能不能造一台不浪费热量的完美热机？', 'Misconception: A Perfect Engine with No Waste?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.wasteHeat && !s.facts.carnotCycle,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：只看能量守恒还不够。热总要从热处流向冷处，循环会留下代价。',
        'Counterexample: conservation alone is not enough. Heat flows from hot to cold, and a cycle leaves a cost.'
      )
      return text(
        '你画出一台不浪费的热机。纸上很完美，现实里的冷端却不肯消失。',
        'You draw an engine with no waste. It is perfect on paper, but the cold side refuses to disappear.'
      )
    }
  },
  {
    id: 'trace_carnot_cycle',
    type: 'experiment',
    chapter: 12,
    label: text('卡诺循环：热机的最高效率由什么决定？', 'Carnot Cycle: What Limits Engine Efficiency?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.wasteHeat,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.carnotCycle = true
      return text(
        '卡诺循环把热机拆成四段。效率不再只是工匠手艺，而成了温度之间的命运。',
        'Carnot cycle splits the engine into four stages. Efficiency is no longer just craftsmanship; it is a fate written between temperatures.'
      )
    }
  },
  {
    id: 'count_microstates',
    type: 'experiment',
    chapter: 12,
    label: text('玻尔兹曼的洞察：熵和分子的排列方式有什么关系？', 'Boltzmann’s Insight: Entropy and Microstates?'),
    hint: text('精力1 -> 思路1', 'Focus 1 -> Insight +1'),
    cost: 1,
    requires: (s) => s.facts.carnotCycle,
    once: true,
    run(s) {
      s.insight += 1
      s.facts.entropyClue = true
      return text(
        '玻尔兹曼把分子当成一大群可能的排法。混乱不是没规律，而是可能性太多。',
        'Boltzmann treats molecules as a crowd of possible arrangements. Disorder is not lawlessness; it is too many possibilities.'
      )
    }
  },
  {
    id: 'law_entropy',
    type: 'theory',
    chapter: 12,
    label: text('提出新概念：孤立系统的熵永不减少，熵增给了时间一个方向', 'Propose: Entropy never decreases; arrow of time'),
    hint: text('精力1 需：循环 分子排法 记录3 思路2 预言1', 'Focus 1; requires: cycle, microstates, Notes 3, Insight 2, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.entropyClue,
    requires: (s) => s.facts.carnotCycle && s.facts.entropyClue && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.entropy = true
      s.chapter = 13
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下熵：能量仍守恒，但可用性会散开。时间的箭头第一次在暗室里有了刻度。',
        'You discover entropy: energy is conserved, but usable energy tends to spread out. The arrow of time gains its first markings in the dark room.'
      )
    }
  },
  {
    id: 'strike_tuning_fork',
    type: 'experiment',
    chapter: 13,
    label: text('敲响音叉：声音是怎么传到耳朵里的？', 'Strike a Tuning Fork: How Does Sound Travel?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.vibration = true
      return text(
        '音叉在手里发颤，声音却钻进耳朵。你开始怀疑：空气也许在跟着颤。',
        'The tuning fork trembles in your hand, yet the sound reaches your ear. You begin to suspect that air trembles too.'
      )
    }
  },
  {
    id: 'wrong_sound_material',
    type: 'misconception',
    chapter: 13,
    label: text('错误直觉：声音是细小的物质微粒飞出来？', 'Misconception: Is Sound Made of Particles?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.vibration && !s.facts.airWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：声音穿过空气，却不是把一团物质丢到耳朵里。抽走空气后，它会消失。',
        'Counterexample: sound crosses air, but it does not throw a lump of matter into the ear. Remove the air, and it disappears.'
      )
      return text(
        '你把声音想成细小的东西飞出去。音叉还在抖，像是在提示“传递”的不是物质本身。',
        'You imagine sound as tiny bits of stuff flying away. The fork keeps trembling, hinting that what travels is not matter itself.'
      )
    }
  },
  {
    id: 'bell_jar',
    type: 'experiment',
    chapter: 13,
    label: text('抽真空实验：没有空气还能听到声音吗？', 'Vacuum Experiment: Sound Without Air?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.vibration,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.airWave = true
      return text(
        '玻璃罩里的铃还在动，声音却越来越薄。空气不是旁观者，它是声音的路。',
        'The bell still moves inside the jar, but the sound thins away. Air is not a bystander; it is the road sound travels on.'
      )
    }
  },
  {
    id: 'map_resonance',
    type: 'experiment',
    chapter: 13,
    label: text('共振实验：声音有形状吗？', 'Resonance: Does Sound Have a Shape?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.airWave,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.resonance = true
      return text(
        '某个频率上，细沙跳出清楚的花纹。声音不是乱颤，而是有形状的波。',
        'At one frequency, sand jumps into a clear pattern. Sound is not random trembling; it is a shaped wave.'
      )
    }
  },
  {
    id: 'law_sound_wave',
    type: 'theory',
    chapter: 13,
    label: text('提出新概念：声音是介质中的机械波，有频率、波长和振幅', 'Propose: Sound is a mechanical wave'),
    hint: text('精力1 需：空气 共振 记录3 思路1 预言1', 'Focus 1; requires: air, resonance, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.resonance,
    requires: (s) => s.facts.airWave && s.facts.resonance && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.sound = true
      s.chapter = 14
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下声波：介质来回振动，扰动向前传播。听见世界，原来是在读空气的波纹。',
        'You understand sound as a wave: particles of the medium vibrate back and forth while the disturbance travels onward. To hear the world is to read ripples in air.'
      )
    }
  },
  {
    id: 'pass_prism',
    type: 'experiment',
    chapter: 14,
    label: text('让白光穿过棱镜：白光真的是单纯的吗？', 'Pass Light Through a Prism: Is White Pure?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectrum = true
      return text(
        '白光被棱镜拆成彩色长带。牛顿把颜色从玻璃的魔术里救出来：颜色本来就在光里。',
        'White light splits into a colored band. Newton rescues color from the magic of glass: color was already in the light.'
      )
    }
  },
  {
    id: 'wrong_color_glass',
    type: 'misconception',
    chapter: 14,
    label: text('错误直觉：颜色是玻璃“制造”出来的？', 'Misconception: Does Glass Create Colors?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum && !s.facts.interference,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：再用第二个棱镜可以把颜色合回白光。玻璃改变路径，却不是凭空制造颜色。',
        'Counterexample: a second prism can recombine colors into white. Glass changes paths; it does not create color from nothing.'
      )
      return text(
        '你把彩色归功于棱镜。光谱却整齐得像一份被拆开的名单。',
        'You credit the prism for the colors. The spectrum looks too orderly, like a list that has been unfolded.'
      )
    }
  },
  {
    id: 'focus_lens',
    type: 'experiment',
    chapter: 14,
    label: text('用透镜成像：光在不同介质中会弯曲吗？', 'Focus with a Lens: Does Light Bend?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.spectrum,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.lens = true
      return text(
        '透镜把远处的烛火压到纸上。望远镜和显微镜从同一种折射里长出来。',
        'A lens forms an image of a distant candle on paper. The telescope and the microscope grow out of the same refraction.'
      )
    }
  },
  {
    id: 'make_interference',
    type: 'experiment',
    chapter: 14,
    label: text('双缝干涉：光能像水波一样互相叠加吗？', 'Double Slit: Can Light Interfere Like Waves?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.lens,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.interference = true
      return text(
        '两条缝在墙上织出明暗条纹。杨氏实验让光像波一样相加、相减。',
        'Two slits weave bright and dark bands on the wall. Young’s experiment shows light adding and canceling like waves.'
      )
    }
  },
  {
    id: 'law_optics',
    type: 'theory',
    chapter: 14,
    label: text('提出新概念：光是一种波，会折射、成像、分色、干涉和衍射', 'Propose: Light is a wave; refraction, interference, diffraction'),
    hint: text('精力1 需：光谱 透镜 干涉 记录3 思路1 预言1', 'Focus 1; requires: spectrum, lens, interference, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.interference,
    requires: (s) => s.facts.spectrum && s.facts.lens && s.facts.interference && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.optics = true
      s.chapter = 15
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下波动光学：光会折射、成像、分色，也会干涉。它的路不是一条线，而是一整片波前。',
        'You establish wave optics: light refracts, forms images, disperses into colors, and interferes. Its behavior is not just a ray path, but a whole wavefront.'
      )
    }
  },
  {
    id: 'chase_light',
    type: 'experiment',
    chapter: 15,
    label: text('思想实验：如果你追着一束光跑，会发生什么？', 'Thought Experiment: What If You Chase Light?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.lightPuzzle = true
      return text(
        '你想象自己追上一束光。若真追上了，麦克斯韦的波会冻住吗？这个念头像一根刺。',
        'You imagine catching a beam of light. If you could, would Maxwell’s wave freeze? The thought is a splinter.'
      )
    }
  },
  {
    id: 'wrong_ether',
    type: 'misconception',
    chapter: 15,
    label: text('错误直觉：光需要“以太”这种介质才能传播？', 'Misconception: Does Light Need “Ether”?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.lightPuzzle && !s.facts.michelsonMorley,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：如果地球穿过以太，光速应该随方向略变。干涉仪会告诉你它有没有变。',
        'Counterexample: if Earth moves through ether, light speed should shift with direction. The interferometer will tell whether it does.'
      )
      return text(
        '你给光安排了一种介质。以太听上去体面，但它还需要留下可测的风。',
        'You assign a medium to light. Ether sounds respectable, but it must leave a measurable wind.'
      )
    }
  },
  {
    id: 'michelson_morley',
    type: 'experiment',
    chapter: 15,
    label: text('迈克耳孙-莫雷实验：能测到以太风吗？', 'Michelson-Morley: Any Ether Wind?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.lightPuzzle,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.michelsonMorley = true
      return text(
        '迈克耳孙和莫雷转动仪器，条纹几乎不动。以太风没有吹来，反而吹倒了旧直觉。',
        'Michelson and Morley rotate the apparatus, and the fringes barely move. No ether wind arrives; instead, an old intuition is blown over.'
      )
    }
  },
  {
    id: 'sync_clocks',
    type: 'experiment',
    chapter: 15,
    label: text('重新思考“同时”：远处的“现在”是绝对的吗？', 'Rethink Simultaneity: Is “Now” Absolute?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.michelsonMorley,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.clocks = true
      return text(
        '你用光信号校准远处时钟，发现“同时”不是宇宙免费赠送的标签，而是一种约定。',
        'You synchronize distant clocks with light signals and find that simultaneity is not a free label from the universe, but a convention.'
      )
    }
  },
  {
    id: 'law_special_relativity',
    type: 'theory',
    chapter: 15,
    label: text('提出新概念：光速不变，空间和时间是相对的，E=mc²', 'Propose: Light speed constant; relativity; E=mc²'),
    hint: text('精力1 需：无以太 同时性 记录3 思路1 预言1', 'Focus 1; requires: no ether wind, simultaneity, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.clocks,
    requires: (s) => s.facts.michelsonMorley && s.facts.clocks && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.specialRelativity = true
      s.chapter = 16
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下狭义相对论：光速不让步，空间和时间只好一起调整。爱因斯坦把“现在”变成一道需要测量的问题。',
        'You establish special relativity: the speed of light is invariant, so space and time must adjust together. Einstein turns "now" into something that depends on how it is measured.'
      )
    }
  },
  {
    id: 'falling_elevator',
    type: 'experiment',
    chapter: 16,
    label: text('思想实验：在自由下落的电梯里，引力还在吗？', 'Thought Experiment: Gravity in a Falling Elevator?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.laws.specialRelativity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.elevator = true
      return text(
        '自由下落的电梯里，重力像暂时消失。爱因斯坦把这个想象实验攥得很紧。',
        'Inside a freely falling elevator, gravity seems to vanish for a moment. Einstein holds tightly to this thought experiment.'
      )
    }
  },
  {
    id: 'wrong_gravity_force_only',
    type: 'misconception',
    chapter: 16,
    label: text('错误直觉：引力就是普通的力，和时空无关？', 'Misconception: Is Gravity Just a Force?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.elevator && !s.facts.curvedSpacetime,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：自由落体可以局部抹掉重力感。也许引力不只是力，而是路径本身变了。',
        'Counterexample: free fall can locally erase the feeling of gravity. Perhaps gravity is not merely a force; perhaps the paths themselves have changed.'
      )
      return text(
        '你把引力画成一只手。电梯里的失重感却悄悄把那只手擦淡了。',
        'You draw gravity as a hand. The weightlessness in the elevator quietly fades that hand.'
      )
    }
  },
  {
    id: 'predict_light_bending',
    type: 'experiment',
    chapter: 16,
    label: text('理论预言：太阳的质量会让经过的星光弯曲吗？', 'Predict: Does the Sun Bend Starlight?'),
    hint: text('精力2 -> 记录1 预言2', 'Focus 2 -> Notes +1, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.elevator,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 2
      s.facts.curvedSpacetime = true
      return text(
        '如果时空会弯，光也该沿着弯路走。太阳边缘的星光成了给宇宙出的考题。',
        'If spacetime curves, light should follow the curve. Starlight beside the Sun becomes an exam question for the universe.'
      )
    }
  },
  {
    id: 'observe_eclipse',
    type: 'experiment',
    chapter: 16,
    label: text('实验验证：日食时观测星光是否真的偏折了', 'Verify: Observe Starlight During an Eclipse'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.curvedSpacetime,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.eclipse = true
      return text(
        '日食时，星光位置偏了一点。爱丁顿的照片让时空弯曲第一次有了公众证词。',
        'During the eclipse, starlight shifts slightly. Eddington’s photographs give curved spacetime its first public witness.'
      )
    }
  },
  {
    id: 'law_general_relativity',
    type: 'theory',
    chapter: 16,
    label: text('提出新概念：物质弯曲时空，弯曲的时空决定物质的运动——引力就是几何', 'Propose: Mass curves spacetime; gravity is geometry'),
    hint: text('精力1 需：电梯 偏折观测 记录3 思路2 预言2', 'Focus 1; requires: falling elevator, light bending, Notes 3, Insight 2, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.eclipse,
    requires: (s) => s.facts.elevator && s.facts.eclipse && s.records >= 3 && s.insight >= 2 && s.predictions >= 2,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 2
      s.laws.generalRelativity = true
      s.chapter = 17
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下广义相对论：物质告诉时空怎样弯曲，时空告诉物质怎样运动。引力变成了几何。',
        'You establish general relativity: matter tells spacetime how to curve, and spacetime tells matter how to move. Gravity becomes geometry.'
      )
    }
  },
  {
    id: 'cathode_ray',
    type: 'experiment',
    chapter: 17,
    label: text('偏转阴极射线：原子内部有什么？', 'Deflect Cathode Rays: Inside the Atom?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.electron = true
      return text(
        '阴极射线被电场和磁场偏转。汤姆孙看见了电子：原子不再是最小的硬球。',
        'Cathode rays bend in electric and magnetic fields. Thomson sees the electron: the atom is no longer the smallest hard sphere.'
      )
    }
  },
  {
    id: 'wrong_solid_atom',
    type: 'misconception',
    chapter: 17,
    label: text('错误直觉：原子是不可分割的实心小球？', 'Misconception: Are Atoms Solid Spheres?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.electron && !s.facts.nucleus,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：如果原子是均匀实心球，少数粒子不该被金箔大角度弹回。',
        'Counterexample: if atoms are uniform solid balls, a few particles should not bounce back from gold foil at large angles.'
      )
      return text(
        '你把原子画成硬球。电子已经从里面跑出来，图却还假装完整。',
        'You draw the atom as a hard sphere. An electron has already escaped from inside, while the picture pretends to be whole.'
      )
    }
  },
  {
    id: 'gold_foil',
    type: 'experiment',
    chapter: 17,
    label: text('轰击金箔：用α粒子探测原子内部结构', 'Bombard Gold Foil: Probe the Atom'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.electron,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.nucleus = true
      return text(
        '大多数粒子穿过去，少数却猛地弹回。卢瑟福像发现炮弹被薄纸反弹：原子中心有个很小很重的核。',
        'Most particles pass through, but a few rebound sharply. Rutherford sees cannonballs bounce from tissue paper: a tiny heavy nucleus sits at the center of the atom.'
      )
    }
  },
  {
    id: 'oil_drop',
    type: 'experiment',
    chapter: 17,
    label: text('测量油滴电荷：电荷是连续的还是分立的？', 'Measure Oil Drops: Continuous or Discrete?'),
    hint: text('精力1 -> 记录1 预言1', 'Focus 1 -> Notes +1, Prediction +1'),
    cost: 1,
    requires: (s) => s.facts.nucleus,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.chargeQuantized = true
      return text(
        '密立根让油滴悬停，电荷总是一份一份出现。电不只是连续的雾，也有颗粒感。',
        'Millikan holds oil drops suspended, and charge appears in repeated units. Electricity is not merely a continuous mist; it has a grain to it.'
      )
    }
  },
  {
    id: 'law_atomic_structure',
    type: 'theory',
    chapter: 17,
    label: text('提出新概念：原子有核，电子在外，电荷有最小单位', 'Propose: Nucleus + electrons; discrete charge'),
    hint: text('精力1 需：电子 原子核 电荷量子 记录3 思路1 预言1', 'Focus 1; requires: electron, nucleus, quantized charge, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.chargeQuantized,
    requires: (s) => s.facts.electron && s.facts.nucleus && s.facts.chargeQuantized && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.atom = true
      s.chapter = 18
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下原子结构：电子在外，原子核在内，电荷有最小单位。物质第一次被拆出内部地形。',
        'You discover atomic structure: electrons occupy the outside, a tiny massive nucleus sits within, and electric charge comes in discrete units. Matter gains internal geography.'
      )
    }
  },
  {
    id: 'blackbody',
    type: 'experiment',
    chapter: 18,
    label: text('记录黑体辐射：热辐射的能量分布有什么规律？', 'Record Blackbody Radiation: What Pattern?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.blackbody = true
      return text(
        '黑体炉口的颜色随温度改变，经典公式却在高频处崩坏。普朗克被迫把能量分成小份。',
        'The blackbody furnace changes color with temperature, while classical formulas fail at high frequency. Planck is forced to divide energy into packets.'
      )
    }
  },
  {
    id: 'wrong_continuous_energy',
    type: 'misconception',
    chapter: 18,
    label: text('错误直觉：能量一定是连续的吗？', 'Misconception: Must Energy Be Continuous?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.blackbody && !s.facts.photoelectric,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：黑体辐射和光电效应都在逼你承认，光和能量有时像一份一份交付。',
        'Counterexample: blackbody radiation and the photoelectric effect both push you to admit that light and energy sometimes arrive in packets.'
      )
      return text(
        '你把能量画成光滑斜坡。炉口的颜色却像一排台阶，不肯变得平滑。',
        'You draw energy as a smooth slope. The blackbody data refuses to fit that smooth picture.'
      )
    }
  },
  {
    id: 'photoelectric',
    type: 'experiment',
    chapter: 18,
    label: text('光电效应：为什么光能打出电子？', 'Photoelectric Effect: Light Kicks Out Electrons?'),
    hint: text('精力2 -> 记录2 预言1', 'Focus 2 -> Notes +2, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.blackbody,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 1
      s.facts.photoelectric = true
      return text(
        '低频强光推不出电子，高频弱光却可以。爱因斯坦把光当成一粒粒能量包，门忽然开了。',
        'Bright low-frequency light cannot eject electrons, while weak high-frequency light can. Einstein treats light as packets of energy, and the explanation opens.'
      )
    }
  },
  {
    id: 'law_quanta',
    type: 'theory',
    chapter: 18,
    label: text('提出新概念：光是一份一份的能量包，E=hν', 'Propose: Light = energy packets; E=hν'),
    hint: text('精力1 需：黑体 光电效应 记录3 思路1 预言1', 'Focus 1; requires: blackbody radiation, photoelectric effect, Notes 3, Insight 1, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.photoelectric,
    requires: (s) => s.facts.blackbody && s.facts.photoelectric && s.records >= 3 && s.insight >= 1 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 1
      s.predictions -= 1
      s.laws.quanta = true
      s.chapter = 19
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下光量子：光既能像波传播，也能像粒子交换能量。经典图像第一次裂出真正的缝。',
        'You discover light quanta: light can propagate like a wave while exchanging energy in particle-like packets. The classical picture cracks for real.'
      )
    }
  },
  {
    id: 'spectral_lines',
    type: 'experiment',
    chapter: 19,
    label: text('观察原子光谱：为什么原子只发出特定颜色的光？', 'Observe Atomic Spectra: Discrete Colors?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.spectralLines = true
      return text(
        '氢原子的光不是连续彩虹，而是一条条固定谱线。原子像只会唱几个音的乐器。',
        'Hydrogen light is not a continuous rainbow, but fixed spectral lines. The atom sounds like an instrument with only certain notes.'
      )
    }
  },
  {
    id: 'wrong_planet_electron',
    type: 'misconception',
    chapter: 19,
    label: text('错误直觉：电子像小行星一样绕核转？', 'Misconception: Electrons Like Tiny Planets?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.spectralLines && !s.facts.matterWave,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：绕圈的带电粒子按经典理论会辐射掉能量，掉进原子核。原子却稳定存在。',
        'Counterexample: a circling charged particle should radiate energy and fall into the nucleus. Atoms remain stable.'
      )
      return text(
        '你把电子画成绕核小行星。图很好懂，可它解释不了原子为什么没有塌掉。',
        'You draw electrons as tiny planets around the nucleus. The picture is clear, but it cannot explain why atoms do not collapse.'
      )
    }
  },
  {
    id: 'matter_wave',
    type: 'experiment',
    chapter: 19,
    label: text('德布罗意假说：电子也有波长？', 'de Broglie Hypothesis: Electrons Have Wavelength?'),
    hint: text('精力2 -> 记录2 思路1 预言1', 'Focus 2 -> Notes +2, Insight +1, Prediction +1'),
    cost: 2,
    requires: (s) => s.facts.spectralLines,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.predictions += 1
      s.facts.matterWave = true
      return text(
        '德布罗意把波长交给电子。轨道不再是任意圆圈，而像只能容纳整圈波纹的弦。',
        'de Broglie assigns a wavelength to the electron. Allowed orbits stop being arbitrary circles and become standing-wave conditions.'
      )
    }
  },
  {
    id: 'uncertainty',
    type: 'experiment',
    chapter: 19,
    label: text('不确定性：位置和动量能同时精确知道吗？', 'Uncertainty: Can We Know Both Exactly?'),
    hint: text('精力1 -> 记录1 思路1', 'Focus 1 -> Notes +1, Insight +1'),
    cost: 1,
    requires: (s) => s.facts.matterWave,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.uncertainty = true
      return text(
        '你越想钉死位置，动量越散开。海森堡不是说仪器太差，而是世界不给这两张精确收据。',
        'The more tightly you pin position, the more momentum spreads. Heisenberg is not blaming bad instruments; the world does not issue both exact receipts at once.'
      )
    }
  },
  {
    id: 'law_quantum_mechanics',
    type: 'theory',
    chapter: 19,
    label: text('提出新概念：粒子状态由波函数描述，只能计算概率，不能确定轨道', 'Propose: Wavefunctions give probabilities, not orbits'),
    hint: text('精力1 需：物质波 不确定性 记录3 思路2 预言1', 'Focus 1; requires: matter waves, uncertainty, Notes 3, Insight 2, Prediction 1'),
    cost: 1,
    visible: (s) => s.facts.uncertainty,
    requires: (s) => s.facts.matterWave && s.facts.uncertainty && s.records >= 3 && s.insight >= 2 && s.predictions >= 1,
    run(s) {
      s.records -= 3
      s.insight -= 2
      s.predictions -= 1
      s.laws.quantum = true
      s.chapter = 20
      s.maxEnergy += ENERGY_PER_CHAPTER; s.energy = s.maxEnergy
      s.feedback = null
      return text(
        '你写下量子力学：薛定谔的波函数给出概率，海森堡的不确定性划出边界。原子世界不再像小机械表。',
        'You establish quantum mechanics: Schrödinger’s wave function gives probabilities, and Heisenberg’s uncertainty principle sets limits. The atomic world is no tiny clockwork mechanism.'
      )
    }
  },
  {
    id: 'cloud_chamber',
    type: 'experiment',
    chapter: 20,
    label: text('观察云室：放射性粒子留下了什么痕迹？', 'Observe Cloud Chamber: Radioactive Traces?'),
    hint: text('精力1 -> 记录1', 'Focus 1 -> Notes +1'),
    cost: 1,
    requires: (s) => s.laws.atom,
    once: true,
    run(s) {
      s.records += 1
      s.facts.radioactivity = true
      return text(
        '云室里细线突然生长又消失。贝克勒尔和居里夫人打开的门，通向原子核深处。',
        'Thin lines suddenly grow and vanish in the cloud chamber. The door opened by Becquerel and Marie Curie leads deep into the nucleus.'
      )
    }
  },
  {
    id: 'wrong_atom_immutable',
    type: 'misconception',
    chapter: 20,
    label: text('错误直觉：原子核是永恒不变的吗？', 'Misconception: Are Nuclei Unchangeable?'),
    hint: text('精力1 -> 疑问1', 'Focus 1 -> Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.radioactivity && !s.facts.fission,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '反例：放射性已经说明原子核会自己改变。用中子敲铀核，看看裂缝会不会变大。',
        'Counterexample: radioactivity already shows that nuclei can change on their own. Strike uranium with neutrons and see whether the crack grows.'
      )
      return text(
        '你把原子核当成最后的硬石头。云室轨迹却像石头里冒出的细烟。',
        'You treat the nucleus as the final hard stone. Cloud-chamber tracks rise from it like thin smoke.'
      )
    }
  },
  {
    id: 'split_uranium',
    type: 'experiment',
    chapter: 20,
    label: text('用中子轰击铀核：核裂变能释放多少能量？', 'Split Uranium: How Much Energy?'),
    hint: text('精力2 -> 记录2 思路1', 'Focus 2 -> Notes +2, Insight +1'),
    cost: 2,
    requires: (s) => s.facts.radioactivity,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.fission = true
      return text(
        '铀核裂成两块，并放出新的中子。哈恩看到结果，迈特纳给出解释：质量差变成了能量。',
        'Uranium splits into two pieces and releases new neutrons. Hahn sees the result, and Meitner explains it: missing mass becomes energy.'
      )
    }
  },
  {
    id: 'chain_reaction',
    type: 'experiment',
    chapter: 20,
    label: text('计算链式反应：一个中子能引发多大的能量释放？', 'Calculate Chain Reaction: Exponential Growth?'),
    hint: text('精力2 -> 记录2 预言2', 'Focus 2 -> Notes +2, Predictions +2'),
    cost: 2,
    requires: (s) => s.facts.fission,
    once: true,
    run(s) {
      s.records += 2
      s.predictions += 2
      s.facts.chainReaction = true
      return text(
        '一个中子引出更多中子，数字开始像火一样蔓延。费米的反应堆和原子弹站在同一条岔路口。',
        'One neutron leads to more neutrons, and the numbers spread like fire. Fermi’s reactor and the atomic bomb stand at the same fork.'
      )
    }
  },
  {
    id: 'law_nuclear_age',
    type: 'theory',
    chapter: 20,
    label: text('提出新概念：核能可以发电也可以造武器——物理学走到了人类选择的十字路口', 'Propose: Nuclear energy; physics at a crossroads'),
    hint: text('精力1 需：裂变 链式反应 记录4 思路1 预言2', 'Focus 1; requires: fission, chain reaction, Notes 4, Insight 1, Predictions 2'),
    cost: 1,
    visible: (s) => s.facts.chainReaction,
    requires: (s) => s.facts.fission && s.facts.chainReaction && s.records >= 4 && s.insight >= 1 && s.predictions >= 2,
    run(s) {
      s.records -= 4
      s.insight -= 1
      s.predictions -= 2
      s.laws.nuclearAge = true
      s.complete = true
      s.feedback = null
      return text(
        '你写下核时代：同一套物理能点亮城市，也能毁掉城市。暗室最后没有给出按钮，只把责任交回你手里。',
        'You enter the nuclear age: the same physics can light cities and destroy them. The dark room gives you no final button; it places responsibility back in your hands.'
      )
    }
  }
]

const LAW_LIST = [
  { key: 'inertia', name: text('第一定律', 'First Law of Motion'), task: text('惯性', 'Inertia') },
  { key: 'second', name: text('第二定律', 'Second Law of Motion'), task: text('F = ma', 'F = ma') },
  { key: 'third', name: text('第三定律', 'Third Law of Motion'), task: text('相互作用', 'Interaction') },
  { key: 'gravity', name: text('万有引力', 'Universal Gravitation'), task: text('地月同律', 'Earth and Moon') },
  { key: 'principia', name: text('《原理》', 'Principia'), task: text('经典力学', 'Classical mechanics') },
  { key: 'charge', name: text('电荷', 'Charge'), task: text('吸引与排斥', 'Attraction and repulsion') },
  { key: 'currentMagnetism', name: text('电流磁效应', 'Magnetic Effect of Current'), task: text('电生磁', 'Current produces magnetism') },
  { key: 'induction', name: text('电磁感应', 'Electromagnetic Induction'), task: text('变化生电', 'Change produces current') },
  { key: 'maxwell', name: text('麦克斯韦方程', 'Maxwell’s Equations'), task: text('光是电磁波', 'Light is an EM wave') },
  { key: 'electricPower', name: text('电力系统', 'Electric Power'), task: text('电机与灯', 'Motors and lamps') },
  { key: 'radio', name: text('无线电', 'Radio'), task: text('远距离通信', 'Long-distance signals') },
  { key: 'energy', name: text('能量守恒', 'Conservation of Energy'), task: text('功热互换', 'Work and heat') },
  { key: 'entropy', name: text('熵增方向', 'Entropy'), task: text('时间箭头', 'Arrow of time') },
  { key: 'sound', name: text('声波', 'Sound Waves'), task: text('空气振动', 'Air vibration') },
  { key: 'optics', name: text('波动光学', 'Wave Optics'), task: text('干涉成像', 'Interference and imaging') },
  { key: 'specialRelativity', name: text('狭义相对论', 'Special Relativity'), task: text('光速不变', 'Invariant light speed') },
  { key: 'generalRelativity', name: text('广义相对论', 'General Relativity'), task: text('弯曲时空', 'Curved spacetime') },
  { key: 'atom', name: text('原子结构', 'Atomic Structure'), task: text('电子与原子核', 'Electron and nucleus') },
  { key: 'quanta', name: text('光量子', 'Light Quanta'), task: text('能量分份', 'Discrete energy packets') },
  { key: 'quantum', name: text('量子力学', 'Quantum Mechanics'), task: text('概率与不确定性', 'Probability and uncertainty') },
  { key: 'nuclearAge', name: text('核时代', 'Nuclear Age'), task: text('裂变与责任', 'Fission and responsibility') }
]

const FACT_CONCEPTS = [
  { key: 'calculus', name: text('微积分', 'Calculus'), task: text('计算瞬时变化', 'Instant change') },
  { key: 'fields', name: text('场', 'Field'), task: text('空间有结构', 'Structured space') },
  { key: 'motor', name: text('电动机', 'Motor'), task: text('电转成运动', 'Electricity to motion') },
  { key: 'bulb', name: text('灯泡', 'Lamp'), task: text('电转成光', 'Electricity to light') },
  { key: 'engine', name: text('热机', 'Heat Engine'), task: text('热推动机器', 'Heat drives machines') },
  { key: 'resonance', name: text('共振', 'Resonance'), task: text('频率选择', 'Frequency selection') },
  { key: 'spectrum', name: text('光谱', 'Spectrum'), task: text('颜色在光中', 'Colors in light') },
  { key: 'curvedSpacetime', name: text('时空弯曲', 'Curved Spacetime'), task: text('光路偏折', 'Bent light paths') },
  { key: 'electron', name: text('电子', 'Electron'), task: text('原子可分', 'Atoms have parts') },
  { key: 'nucleus', name: text('原子核', 'Nucleus'), task: text('小而重的中心', 'Small heavy center') },
  { key: 'matterWave', name: text('物质波', 'Matter Wave'), task: text('电子也有波', 'Electrons have wave behavior') },
  { key: 'fission', name: text('裂变', 'Fission'), task: text('质量变能量', 'Mass-energy conversion') }
]

const CHAPTER_FACT_KEYS = [
  ['watch_apple', 'compare_objects', 'build_slope', 'apple', 'manyFall', 'slope'],
  ['push_cart', 'vary_force', 'add_mass', 'invent_calculus', 'push', 'forceChange', 'mass', 'calculus'],
  ['collide_carts', 'pull_rope', 'measure_pair_force', 'collision', 'rope', 'equalPair'],
  ['read_moon', 'estimate_curve', 'compare_earth_sky', 'moon', 'curve', 'sameGravity'],
  [],
  ['rub_amber', 'compare_charges', 'amber', 'chargePair'],
  ['close_circuit', 'compass_near_wire', 'current', 'oersted'],
  ['move_magnet_coil', 'reverse_motion', 'induction', 'changeMatters'],
  ['draw_fields', 'measure_wave_speed', 'fields', 'lightSpeed'],
  ['spin_motor', 'turn_generator', 'light_filament', 'motor', 'generator', 'bulb'],
  ['spark_gap', 'build_antenna', 'tune_receiver', 'spark', 'antenna', 'radio'],
  ['heat_water', 'turn_paddle', 'build_heat_engine', 'steam', 'joule', 'engine'],
  ['watch_waste_heat', 'trace_carnot_cycle', 'count_microstates', 'wasteHeat', 'carnotCycle', 'entropyClue'],
  ['strike_tuning_fork', 'bell_jar', 'map_resonance', 'vibration', 'airWave', 'resonance'],
  ['pass_prism', 'focus_lens', 'make_interference', 'spectrum', 'lens', 'interference'],
  ['chase_light', 'michelson_morley', 'sync_clocks', 'lightPuzzle', 'michelsonMorley', 'clocks'],
  ['falling_elevator', 'predict_light_bending', 'observe_eclipse', 'elevator', 'curvedSpacetime', 'eclipse'],
  ['cathode_ray', 'gold_foil', 'oil_drop', 'electron', 'nucleus', 'chargeQuantized'],
  ['blackbody', 'photoelectric', 'blackbody', 'photoelectric'],
  ['spectral_lines', 'matter_wave', 'uncertainty', 'spectralLines', 'matterWave', 'uncertainty'],
  ['cloud_chamber', 'split_uranium', 'chain_reaction', 'radioactivity', 'fission', 'chainReaction']
]

const CHAPTER_LAW_KEYS = [
  ['inertia'],
  ['second'],
  ['third'],
  ['gravity'],
  ['principia'],
  ['charge'],
  ['currentMagnetism'],
  ['induction'],
  ['maxwell'],
  ['electricPower'],
  ['radio'],
  ['energy'],
  ['entropy'],
  ['sound'],
  ['optics'],
  ['specialRelativity'],
  ['generalRelativity'],
  ['atom'],
  ['quanta'],
  ['quantum'],
  ['nuclearAge']
]

function cloneState(state) {
  return JSON.parse(JSON.stringify(state))
}

function migrateSavedState(state) {
  if (state.complete && !state.laws.nuclearAge) {
    state.complete = false
    state.chapter = state.laws.maxwell ? 9 : Math.max(state.chapter || 0, 5)
    if (!state.laws.maxwell) state.laws.principia = true
    state.feedback = null
    state.logs = [
      {
        time: state.day || 1,
        text: text(
          '你翻开新的纸页。旧结局退后一步，电机、热机、光谱和原子核在暗处等着继续发问。',
          'You open a new page. The old ending steps aside, while motors, heat engines, spectra, and nuclei wait in the dark with new questions.'
        )
      },
      ...(state.logs || [])
    ]
  }
  return state
}

function clearProgressFromChapter(state, chapter) {
  for (let index = chapter; index < CHAPTERS.length; index += 1) {
    ;(CHAPTER_FACT_KEYS[index] || []).forEach((key) => {
      delete state.facts[key]
    })
    ;(CHAPTER_LAW_KEYS[index] || []).forEach((key) => {
      delete state.laws[key]
    })
  }
}

function findReadyTheory(state) {
  return ACTIONS.find((action) =>
    action.type === 'theory' &&
    action.chapter === state.chapter &&
    (!action.visible || action.visible(state)) &&
    canRun(state, action)
  )
}

function canRun(state, action) {
  if (state.complete) return false
  if (action.chapter !== state.chapter) return false
  if (action.once && state.facts[action.id]) return false
  if (state.energy <= 0) return false
  return !action.requires || action.requires(state)
}

function actionKind(action, lang) {
  if (action.type === 'theory') return pick(UI.kinds.theory, lang)
  if (action.type === 'experiment') return pick(UI.kinds.experiment, lang)
  if (action.type === 'misconception') return pick(UI.kinds.misconception, lang)
  return pick(UI.kinds.rest, lang)
}

const REST_OPTIONS = [
  { id: 'rest_orchard', text: text('在苹果树下静坐，看果子一颗颗落下', 'Sit under the apple tree, watching fruit fall'), effects: [
    { p: 0.4, desc: text('微风拂过，你感到精力充沛。', 'A breeze passes. You feel refreshed.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('一颗苹果砸在脚边。你忽然想到：为什么它总是直直往下落？', 'An apple drops beside your foot. You wonder: why does it always fall straight down?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('你在树下睡着了，梦到月亮也在往下掉。醒来后精力恢复了不少。', 'You doze off and dream the Moon is falling too. You wake refreshed.'), energy: 8, insight: 0, doubt: 0 }
  ]},
  { id: 'rest_walk', text: text('在花园小径散步，观察花草的生长', 'Walk the garden path, observing plants grow'), effects: [
    { p: 0.5, desc: text('散步让思绪清晰起来。', 'The walk clears your mind.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('你注意到藤蔓总是绕着支架生长——一种看不见的规律在起作用。', 'You notice vines always spiral around their supports — an invisible rule at work.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('一只蝴蝶落在肩上。你忽然觉得，自然界的秩序比想象中更美。', 'A butterfly lands on your shoulder. Nature’s order is more beautiful than you imagined.'), energy: 7, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_tea', text: text('泡一壶茶，和路过的老友聊聊天', 'Brew tea and chat with an old friend'), effects: [
    { p: 0.4, desc: text('老友讲了一个关于磁石的故事，很有趣，但和你的研究无关。', 'Your friend tells a story about lodestones — interesting, but unrelated to your work.'), energy: 6, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('老友问你在研究什么。你试着解释，说着说着自己也有了新的想法。', 'Your friend asks about your research. Explaining it gives you a new idea.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('茶很香，朋友的笑话让你彻底放松下来。', 'The tea is fragrant, and your friend’s jokes let you fully relax.'), energy: 9, insight: 0, doubt: -1 }
  ]},
  { id: 'rest_stargaze', text: text('夜里登上屋顶，用望远镜看星星', 'Climb to the roof at night, gaze at stars through a telescope'), effects: [
    { p: 0.4, desc: text('星空很美，但今晚没有特别的发现。', 'The stars are beautiful, but tonight brings no special discovery.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('你注意到木星旁边有几颗小星排成一条线。伽利略也曾看过它们。', 'You notice small stars lined up beside Jupiter. Galileo saw them too.'), energy: 4, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('一颗流星划过。你许了个愿，然后想到：流星的轨迹也是物理。', 'A shooting star crosses the sky. You make a wish, then realize: its path is physics too.'), energy: 6, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_music', text: text('拿起鲁特琴，弹一首伽利略父亲作的曲子', 'Pick up the lute, play a piece by Galileo’s father'), effects: [
    { p: 0.5, desc: text('音乐让心情平静下来。', 'The music calms your mind.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('弹到一半，你注意到琴弦的振动——声音和振动之间有什么关系？', 'Midway, you notice the string’s vibration — what is the link between sound and vibration?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.2, desc: text('你即兴弹了一段从未听过的旋律。创造力似乎被唤醒了。', 'You improvise a melody you have never heard. Creativity seems awakened.'), energy: 7, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_sketch', text: text('拿出炭笔，画下桌上的实验装置', 'Take out charcoal and sketch the apparatus'), effects: [
    { p: 0.4, desc: text('画得很仔细，但只是重复了已知的东西。', 'You draw carefully, but only reproduce what you already know.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.4, desc: text('画着画着，你发现之前忽略了一个细节——装置的角度可能很重要。', 'While drawing, you notice a detail you missed — the angle of the apparatus might matter.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('画完后你退后一步看，整张图忽然有了新的意义。', 'Stepping back, the whole drawing suddenly takes on new meaning.'), energy: 5, insight: 2, doubt: -1 }
  ]},
  { id: 'rest_read', text: text('翻阅前人的手稿和信件', 'Read through old manuscripts and letters'), effects: [
    { p: 0.4, desc: text('手稿很厚，但大部分内容你已经知道了。', 'The manuscripts are thick, but you already know most of it.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('在一封旧信里，你发现了一个被遗忘的实验思路。', 'In an old letter, you find a forgotten experimental approach.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('前人的困惑和你的困惑如此相似。你不再觉得孤单。', 'Their confusion mirrors yours. You no longer feel alone.'), energy: 6, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_experiment', text: text('做一些无关的小实验，纯粹为了好玩', 'Do some unrelated small experiments, just for fun'), effects: [
    { p: 0.3, desc: text('小实验失败了，但你笑得很开心。', 'The small experiment fails, but you laugh heartily.'), energy: 6, insight: 0, doubt: 0 },
    { p: 0.4, desc: text('一个意外的现象引起了你的注意——虽然和当前研究无关，但值得记下来。', 'An unexpected phenomenon catches your eye — unrelated but worth noting.'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('玩着玩着，你忽然想到了一种新的测量方法。', 'Playing around, you suddenly think of a new measurement method.'), energy: 4, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_nap', text: text('趴在桌上小睡一会儿', 'Nap at the desk for a while'), effects: [
    { p: 0.5, desc: text('睡了半小时，醒来精神好多了。', 'You sleep for half an hour and wake feeling much better.'), energy: 8, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('半梦半醒之间，一个模糊的想法飘过脑海。你赶紧记下来。', 'Between sleep and waking, a vague idea drifts through your mind. You quickly write it down.'), energy: 6, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('你做了一个奇怪的梦，梦里所有的物理定律都是反的。醒来后你觉得这很有意思。', 'You dream all physical laws are reversed. You wake up finding it intriguing.'), energy: 7, insight: 1, doubt: 1 }
  ]},
  { id: 'rest_organize', text: text('整理散乱的笔记和草稿', 'Organize scattered notes and drafts'), effects: [
    { p: 0.4, desc: text('桌面整洁了不少，但没发现什么新东西。', 'The desk is tidier, but nothing new emerges.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('整理时发现两张草稿纸上画着相似的东西——你之前怎么没注意到？', 'While organizing, you find two drafts with similar drawings — how did you miss this?'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('把笔记按时间排列后，思路的演变清晰可见。你看到了自己的进步。', 'Arranging notes chronologically, the evolution of your thinking becomes clear. You see your own progress.'), energy: 6, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_water', text: text('去河边散步，往水里扔石子看涟漪', 'Walk by the river, skip stones and watch ripples'), effects: [
    { p: 0.4, desc: text('涟漪一圈圈散开，很放松。', 'Ripples spread in circles. Relaxing.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('你盯着涟漪看了很久。波从中心向外传播——光和声音是不是也这样？', 'You stare at the ripples. Waves spread from the center — do light and sound do the same?'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('两块石子同时落水，两圈涟漪交叉穿过。你看到了干涉。', 'Two stones hit the water together, their ripples crossing. You see interference.'), energy: 5, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_chess', text: text('和邻居下一盘国际象棋', 'Play a game of chess with a neighbor'), effects: [
    { p: 0.5, desc: text('棋局激烈，你暂时忘记了研究的事。', 'The game is intense, and you forget about research for a while.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('对手走了一步妙棋。你忽然想到：自然界是不是也在走一步妙棋？', 'Your opponent makes a brilliant move. You wonder: is nature also making brilliant moves?'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('你赢了。胜利的感觉让你信心倍增。', 'You win. The feeling of victory boosts your confidence.'), energy: 8, insight: 1, doubt: -1 }
  ]},
  { id: 'rest_garden', text: text('在花园里给植物浇水，修剪枝叶', 'Water plants and trim branches in the garden'), effects: [
    { p: 0.5, desc: text('体力劳动让大脑得到了休息。', 'Physical labor gives your brain a rest.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('修剪枝叶时，你注意到植物的生长遵循某种数学规律。', 'While trimming, you notice plant growth follows a mathematical pattern.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('一株你从未注意过的花开了。新的事物总在最不经意的时候出现。', 'A flower you never noticed has bloomed. New things appear when least expected.'), energy: 6, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_candle', text: text('在烛光下写日记，记录今天的思考', 'Write in your journal by candlelight'), effects: [
    { p: 0.4, desc: text('写了很多，但都是已知的东西。', 'You write a lot, but it is all known.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('写着写着，一个模糊的想法变得清晰起来。', 'As you write, a vague idea becomes clear.'), energy: 4, insight: 1, doubt: -1 },
    { p: 0.3, desc: text('烛火在纸上投下跳动的影子。你盯着火焰看了很久——热和光，它们是什么关系？', 'The candle flame casts dancing shadows. You stare at the fire — heat and light, how are they related?'), energy: 5, insight: 1, doubt: 1 }
  ]},
  { id: 'rest_pet', text: text('逗弄实验室里养的小狗麦克斯', 'Play with Max, the lab dog'), effects: [
    { p: 0.5, desc: text('麦克斯摇着尾巴，你笑了。简单的快乐也是研究的一部分。', 'Max wags his tail, and you smile. Simple joy is part of research too.'), energy: 7, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('麦克斯追着自己的尾巴转圈。你忽然想到：圆周运动也需要力。', 'Max chases his own tail in circles. You realize: circular motion also requires force.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('麦克斯叼来一个球。你扔出去，它总能接住——动物对抛物线的直觉比人类还好。', 'Max fetches a ball. You throw it, and he always catches it — animals have better intuition for parabolas than humans.'), energy: 6, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_bake', text: text('烤一个苹果派，让甜味充满房间', 'Bake an apple pie, filling the room with sweetness'), effects: [
    { p: 0.5, desc: text('苹果派出炉了，香气让整个暗室温暖起来。', 'The pie is done, its aroma warming the dark room.'), energy: 8, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('切派的时候你注意到：热从烤箱传到派上，派又慢慢冷却——热总是从热的地方流向冷的地方。', 'Cutting the pie, you notice: heat flows from oven to pie, and the pie slowly cools — heat always flows from hot to cold.'), energy: 6, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('太好吃了。你决定以后多做几次。灵感往往在满足的胃里发芽。', 'Delicious. You decide to do this more often. Inspiration often sprouts from a satisfied stomach.'), energy: 9, insight: 1, doubt: 0 }
  ]},
  { id: 'rest_meditate', text: text('闭目静思，让思绪自由漂浮', 'Close your eyes and let thoughts drift freely'), effects: [
    { p: 0.4, desc: text('静坐片刻，内心平静下来。', 'A moment of stillness, and your mind settles.'), energy: 6, insight: 0, doubt: -1 },
    { p: 0.3, desc: text('在安静中，一个被忽略的问题浮出水面。', 'In the quiet, a neglected question surfaces.'), energy: 5, insight: 1, doubt: 1 },
    { p: 0.3, desc: text('你进入了很深的专注状态。睁开眼睛时，世界似乎变得更清晰了。', 'You enter a deep state of focus. When you open your eyes, the world seems sharper.'), energy: 7, insight: 2, doubt: -1 }
  ]},
  { id: 'rest_puzzle', text: text('玩一个机械拼图，锻炼手指和大脑', 'Play with a mechanical puzzle, exercising fingers and mind'), effects: [
    { p: 0.4, desc: text('拼图很难，但你乐在其中。', 'The puzzle is hard, but you enjoy it.'), energy: 5, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('解开拼图的那一刻，你忽然理解了：复杂的系统可能由简单的规则组成。', 'The moment the puzzle clicks, you understand: complex systems can arise from simple rules.'), energy: 4, insight: 1, doubt: 0 },
    { p: 0.3, desc: text('你发明了一种新的解法。创造力在玩耍时最活跃。', 'You invent a new solution. Creativity is most active during play.'), energy: 6, insight: 2, doubt: 0 }
  ]},
  { id: 'rest_balcony', text: text('站在阳台上，看远处的山和云', 'Stand on the balcony, watching distant mountains and clouds'), effects: [
    { p: 0.5, desc: text('远眺让眼睛和大脑都得到了休息。', 'The distant view rests both your eyes and mind.'), energy: 7, insight: 0, doubt: 0 },
    { p: 0.3, desc: text('云在移动，但它们的形状一直在变。你想到：有些东西在变，有些规律不变。', 'Clouds move, their shapes ever-changing. You think: some things change, but some rules stay constant.'), energy: 5, insight: 1, doubt: 0 },
    { p: 0.2, desc: text('远处的闪电划过天空，几秒后雷声才到。光和声音的速度不一样。', 'Distant lightning flashes, thunder follows seconds later. Light and sound travel at different speeds.'), energy: 6, insight: 2, doubt: 1 }
  ]},
]
const THEORY_DEFS = {
  law_inertia: text('物体在不受外力时保持静止或匀速直线运动', 'An object remains at rest or in uniform motion unless acted upon by a force'),
  law_second: text('力等于质量乘以加速度 F=ma', 'Force equals mass times acceleration F=ma'),
  law_third: text('作用力与反作用力大小相等方向相反', 'Every action has an equal and opposite reaction'),
  law_gravity: text('任何两个物体之间都存在引力，与质量乘积成正比', 'Every mass attracts every other mass with a force proportional to their product'),
  write_principia: text('将力学三大定律和万有引力系统化为经典力学体系', 'Systematize the laws of motion and gravity into classical mechanics'),
  law_charge: text('自然界存在正负两种电荷，同斥异吸', 'Nature has positive and negative charges; like repels, unlike attracts'),
  law_current_magnetism: text('电流通过导线时会在周围产生磁场', 'An electric current flowing through a wire creates a magnetic field around it'),
  law_induction: text('变化的磁场会在导体中产生感应电动势', 'A changing magnetic field induces an electromotive force in a conductor'),
  law_maxwell: text('电场和磁场相互激发，形成电磁波以光速传播', 'Electric and magnetic fields generate each other, forming electromagnetic waves traveling at light speed'),
  law_electric_power: text('利用电磁感应原理将机械能转化为电能', 'Convert mechanical energy into electrical energy using electromagnetic induction'),
  law_radio: text('利用电磁波在空间中传输信息', 'Use electromagnetic waves to transmit information through space'),
  law_energy: text('能量不会凭空产生或消失，只会从一种形式转化为另一种', 'Energy cannot be created or destroyed, only transformed from one form to another'),
  law_entropy: text('孤立系统的熵永不减少，自然过程有方向性', 'The entropy of an isolated system never decreases; natural processes have direction'),
  law_sound_wave: text('声音是介质中传播的机械纵波', 'Sound is a mechanical longitudinal wave propagating through a medium'),
  law_optics: text('光是一种电磁波，可解释干涉、衍射等现象', 'Light is an electromagnetic wave, explaining interference and diffraction'),
  law_special_relativity: text('物理定律在所有惯性系中相同，光速不变', 'The laws of physics are the same in all inertial frames; the speed of light is constant'),
  law_general_relativity: text('引力是时空弯曲的表现，物质告诉时空如何弯曲', 'Gravity is the curvature of spacetime; matter tells spacetime how to curve'),
  law_atomic_structure: text('原子由原子核和绕核运动的电子组成', 'Atoms consist of a nucleus surrounded by orbiting electrons'),
  law_quanta: text('光以离散的能量包（光子）形式存在 E=hν', 'Light exists as discrete packets of energy (photons) E=hν'),
  law_quantum_mechanics: text('微观粒子具有波粒二象性，由波函数描述', 'Microscopic particles exhibit wave-particle duality, described by wave functions'),
  law_nuclear_age: text('原子核可以裂变或聚变，释放巨大能量', 'Atomic nuclei can undergo fission or fusion, releasing enormous energy')
}

const THEORY_TOASTS = {
  law_inertia: text('恭喜你，你已经提出了牛顿第一运动定律。', 'You have discovered Newton’s first law of motion.'),
  law_second: text('恭喜你，你已经总结出牛顿第二运动定律。', 'You have discovered Newton’s second law of motion.'),
  law_third: text('恭喜你，你已经总结出牛顿第三运动定律。', 'You have discovered Newton’s third law of motion.'),
  law_gravity: text('恭喜你，你已经提出了万有引力定律。', 'You have proposed the law of universal gravitation.'),
  write_principia: text('恭喜你，你已经写成《自然哲学的数学原理》。', 'You have written the Principia.'),
  law_charge: text('恭喜你，你已经定义了电荷概念。', 'You have defined electric charge.'),
  law_current_magnetism: text('恭喜你，你已经发现了电流的磁效应。', 'You have discovered the magnetic effect of electric current.'),
  law_induction: text('恭喜你，你已经发现了电磁感应：变化的磁通量会产生感应电动势。', 'You have discovered electromagnetic induction: a changing magnetic flux induces an emf.'),
  law_maxwell: text('恭喜你，你已经写下了麦克斯韦方程组。', 'You have written Maxwell’s equations.'),
  law_electric_power: text('恭喜你，你已经搭建出电力系统的基本图景。', 'You have built the basic picture of an electric power system.'),
  law_radio: text('恭喜你，你已经实现了无线通信。', 'You have established wireless communication.'),
  law_energy: text('恭喜你，你已经总结出能量守恒定律。', 'You have discovered the law of conservation of energy.'),
  law_entropy: text('恭喜你，你已经认识到熵增给出了自然过程的方向。', 'You have discovered the entropy principle: natural processes have a direction.'),
  law_sound_wave: text('恭喜你，你已经理解：声音是一种机械波。', 'You now understand that sound is a mechanical wave.'),
  law_optics: text('恭喜你，你已经建立了光的波动图像。', 'You have established the wave model of light.'),
  law_special_relativity: text('恭喜你，你已经建立了狭义相对论。', 'You have established special relativity.'),
  law_general_relativity: text('恭喜你，你已经建立了广义相对论。', 'You have established general relativity.'),
  law_atomic_structure: text('恭喜你，你已经发现了原子结构。', 'You have discovered atomic structure.'),
  law_quanta: text('恭喜你，你已经提出了光量子。', 'You have discovered light quanta.'),
  law_quantum_mechanics: text('恭喜你，你已经建立了量子力学。', 'You have established quantum mechanics.'),
  law_nuclear_age: text('恭喜你，你已经进入了核时代。', 'You have entered the nuclear age.')
}

function theoryToastText(action, lang) {
  if (THEORY_TOASTS[action.id]) return pick(THEORY_TOASTS[action.id], lang)

  const label = pick(action.label, lang)
  if (lang === 'zh') {
    return `恭喜你，新的理论已经完成：${label}。`
  }

  const patterns = [
    [/^Discover (.+)$/, 'You have discovered $1.'],
    [/^Establish (.+)$/, 'You have established $1.'],
    [/^Define (.+)$/, 'You have defined $1.'],
    [/^Understand (.+)$/, 'You now understand $1.'],
    [/^Build (.+)$/, 'You have built $1.'],
    [/^Enter (.+)$/, 'You have entered $1.'],
    [/^Write (.+)$/, 'You have written $1.'],
    [/^Propose (.+)$/, 'You have proposed $1.']
  ]
  for (const [pattern, template] of patterns) {
    const match = label.match(pattern)
    if (match) return template.replace('$1', match[1])
  }
  return `You have completed: ${label}.`
}

Page({
  data: {
    title: '牛顿的暗室',
    scene: '',
    goal: '',
    phaseLabel: '第一问',
    actions: [],
    resources: [],
    workers: [],
    logs: [],
    feedback: '',
    ui: {},
    lang: 'zh'
  },

  onLoad() {
    const saved = wx.getStorageSync(STORAGE_KEY)
    this.state = saved ? migrateSavedState({ ...cloneState(START_STATE), ...saved }) : cloneState(START_STATE)
    if (!this.state.lang) this.state.lang = 'zh'
    if (!this.state.maxEnergy) this.state.maxEnergy = BASE_MAX_ENERGY
    if (this.state.energy === undefined) this.state.energy = this.state.maxEnergy
    if (this.state.insight === undefined) this.state.insight = 0
    if (this.state.doubt === undefined) this.state.doubt = 1
    this.render()
  },

  onHide() {
    this.save()
  },

  switchLanguage() {
    this.state.lang = this.state.lang === 'zh' ? 'en' : 'zh'
    this.afterChange()
  },

  openResetMenu() {
    const lang = this.state.lang || 'zh'
    wx.showActionSheet({
      itemList: [pick(UI.resetChapter, lang), pick(UI.resetAll, lang)],
      success: (result) => {
        if (result.tapIndex === 0) this.resetChapter()
        if (result.tapIndex === 1) this.resetGame()
      }
    })
  },

  resetChapter() {
    const chapter = this.state.complete ? CHAPTERS.length - 1 : this.state.chapter
    clearProgressFromChapter(this.state, chapter)
    this.state.chapter = chapter
    this.state.complete = false
    this.state.energy = this.state.maxEnergy
    this.state.feedback = null
    this.log(text(
      '你把本章的纸页翻回开头。前面的定律还在，眼前的问题重新变暗。',
      'You turn this chapter back to its first page. Earlier laws remain; the question before you grows dark again.'
    ))
    this.afterChange()
  },

  resetGame() {
    const lang = this.state.lang || 'zh'
    this.state = cloneState(START_STATE)
    this.state.lang = lang
    if (wx.removeStorageSync) wx.removeStorageSync(STORAGE_KEY)
    this.render()
  },

  handleAction(event) {
    const id = event.currentTarget.dataset.id
    const s = this.state

    if (id === 'propose_theory') {
      const theory = findReadyTheory(s)
      if (theory) {
        this.discoverTheory(theory)
      }
      this.afterChange()
      return
    }

    if (id === 'new_day') {
      s._restOption = null
      s._restOptions = null
      this.newDay()
      this.afterChange()
      return
    }

    const action = ACTIONS.find((item) => item.id === id)
    if (!action || !canRun(s, action)) return

    // Energy cost
    const cost = action.type === 'theory' ? THEORY_ENERGY_COST : ACTION_ENERGY_COST
    s.energy -= cost

    const message = action.run(s)
    if (action.once) {
      s.facts[action.id] = true
      if (action.type === 'experiment') s.feedback = null
    }

    // Successful experiment may reduce doubt
    if (action.type === 'experiment' && s.doubt > 0) {
      s.doubt -= 1
    }
    // Misconception increases doubt
    if (action.type === 'misconception') {
      s.doubt += 1
    }

    this.log(message)
    this.afterChange()
  },

  discoverTheory(action) {
    const cost = THEORY_ENERGY_COST
    this.state.energy -= cost
    const message = action.run(this.state)
    this.log(message)
    this.showTheoryToast(action)
  },

  showTheoryToast(action) {
    if (!wx.showModal) return
    const lang = this.state.lang || 'zh'
    wx.showModal({
      title: pick(text('新的理论', 'New Theory'), lang),
      content: theoryToastText(action, lang),
      showCancel: false,
      confirmText: pick(text('继续', 'Continue'), lang)
    })
  },

  newDay() {
    const s = this.state
    s.day += 1

    // Pick a random rest option and apply its effects
    const restOpt = s._restOption || REST_OPTIONS[Math.floor(Math.random() * REST_OPTIONS.length)]
    const effects = restOpt.effects || [{ p: 1, desc: text('你休息了一会儿。', 'You rest for a while.'), energy: 5, insight: 0, doubt: 0 }]

    // Weighted random selection
    const roll = Math.random()
    let cumulative = 0
    let chosen = effects[effects.length - 1]
    for (const eff of effects) {
      cumulative += eff.p
      if (roll <= cumulative) { chosen = eff; break }
    }

    // Apply effects
    const energyGain = chosen.energy || 5
    s.energy = Math.min(s.maxEnergy, s.energy + energyGain)
    if (chosen.insight) s.insight = Math.max(0, s.insight + chosen.insight)
    if (chosen.doubt) s.doubt = Math.max(0, s.doubt + chosen.doubt)

    this.log(chosen.desc)
  },

  afterChange() {
    const s = this.state
    // Check for doubt confusion
    if (s.doubt >= DOUBT_LOCK && s.insight < INSIGHT_REQUIRE) {
      s.feedback = UI.doubtConfused
    } else if (s.doubt >= DOUBT_LOCK && s.insight >= INSIGHT_SPARK) {
      s.feedback = UI.insightSpark
    } else {
      s.feedback = null
    }
    this.render()
    this.save()
  },

  getActions() {
    const s = this.state
    const lang = s.lang || 'zh'
    if (s.complete) return []

    const readyTheory = findReadyTheory(s)
    const confused = s.doubt >= DOUBT_LOCK && s.insight < INSIGHT_REQUIRE

    const chapterActions = ACTIONS
      .filter((action) => action.chapter === s.chapter)
      .filter((action) => action.type !== 'theory')
      .filter((action) => !action.visible || action.visible(s))
      .filter((action) => !action.once || !s.facts[action.id])
      .map((action) => ({
        id: action.id,
        label: pick(action.label, lang),
        hint: pick(action.hint, lang),
        kind: actionKind(action, lang),
        primary: action.type === 'theory',
        type: action.type,
        enabled: !confused && Boolean(canRun(s, action)),
        locked: confused ? pick(UI.doubtConfused, lang) : ''
      }))

    const enabledExperiments = chapterActions.filter((a) => a.enabled && a.type === 'experiment')
    const enabledMisconceptions = chapterActions.filter((a) => a.enabled && a.type === 'misconception')
    const visible = []

    if (enabledExperiments[0]) visible.push(enabledExperiments[0])
    if (enabledMisconceptions[0]) visible.push(enabledMisconceptions[0])
    if (enabledExperiments[1]) visible.push(enabledExperiments[1])

    // Fill remaining slots
    if (readyTheory || s.energy <= 0 || visible.length < 3) {
      if (readyTheory || s.energy <= 0) {
        if (readyTheory) {
          const theoryDef = THEORY_DEFS[readyTheory.id] || { zh: '', en: '' }
          visible.push({
            id: 'propose_theory',
            label: pick(theoryDef, lang),
            hint: pick(text('提出新概念', 'Propose New Concept'), lang),
            kind: pick(UI.kinds.theory, lang),
            primary: true,
            enabled: true
          })
        } else {
          if (!s._restOption) s._restOption = REST_OPTIONS[Math.floor(Math.random() * REST_OPTIONS.length)]
          visible.push({
            id: 'new_day',
            label: pick(s._restOption.text, lang),
            hint: pick(text('休息恢复精力', 'Rest to recover energy'), lang),
            kind: pick(UI.kinds.rest, lang),
            primary: false,
            enabled: true
          })
        }
      } else {
        const slots = 3 - visible.length
        if (!s._restOptions) {
          s._restOptions = [...REST_OPTIONS].sort(() => Math.random() - 0.5).slice(0, slots)
        }
        s._restOptions.forEach((opt) => {
          visible.push({
            id: 'new_day',
            label: pick(opt.text, lang),
            hint: pick(text('休息恢复精力', 'Rest to recover energy'), lang),
            kind: pick(UI.kinds.rest, lang),
            primary: false,
            enabled: true
          })
        })
      }
    }

    return visible.slice(0, 3)
  },

  render() {
    const s = this.state
    const lang = s.lang || 'zh'
    const chapter = CHAPTERS[s.chapter]

    this.setData({
      lang,
      ui: {
        reset: pick(UI.reset, lang),
        resetChapter: pick(UI.resetChapter, lang),
        resetAll: pick(UI.resetAll, lang),
        lang: pick(UI.lang, lang),
        concepts: pick(UI.concepts, lang),
        log: pick(UI.log, lang)
      },
      title: s.complete ? pick(UI.completeTitle, lang) : pick(chapter.title, lang),
      scene: s.complete ? pick(UI.completeScene, lang) : pick(chapter.scene, lang),
      goal: s.complete ? pick(UI.completeGoal, lang) : pick(chapter.question, lang),
      phaseLabel: s.complete
        ? pick(UI.complete, lang)
        : lang === 'zh'
          ? `${pick(chapter.label, lang)} · 第${s.day}${pick(UI.roundSuffix, lang)}`
          : `${pick(chapter.label, lang)} · ${pick(UI.day, lang)}${s.day}`,
      actions: this.getActions(),
      feedback: s.feedback ? pick(s.feedback, lang) : '',
      resources: [
        { key: 'energy', label: pick(UI.resources.energy, lang), value: s.energy, maxText: `/${s.maxEnergy}` },
        { key: 'notes', label: pick(UI.resources.notes, lang), value: s.records, maxText: '' },
        { key: 'insight', label: pick(UI.resources.insight, lang), value: s.insight, maxText: '' },
        { key: 'doubt', label: pick(UI.resources.doubt, lang), value: s.doubt, maxText: '' }
      ],
      workers: this.getDiscoveries(),
      logs: s.logs.map((item, index) => ({
        key: `${item.time}-${index}`,
        time: item.time,
        text: pick(item.text, lang)
      }))
    })
  },

  getDiscoveries() {
    const lang = this.state.lang || 'zh'
    const facts = FACT_CONCEPTS
      .filter((fact) => this.state.facts[fact.key])
      .map((fact) => ({
        name: pick(fact.name, lang),
        task: pick(fact.task, lang)
      }))
    const laws = LAW_LIST
      .filter((law) => this.state.laws[law.key])
      .map((law) => ({
        name: pick(law.name, lang),
        task: pick(law.task, lang)
      }))
    return facts.concat(laws)
  },

  log(message) {
    const textValue = typeof message === 'string' ? text(message, message) : message
    const last = this.state.logs[0]
    if (last && pick(last.text, this.state.lang || 'zh') === pick(textValue, this.state.lang || 'zh')) return
    this.state.logs.unshift({ time: Date.now(), text: textValue })
    this.state.logs = this.state.logs.slice(0, 120)
  },

  save() {
    wx.setStorageSync(STORAGE_KEY, this.state)
  }
})

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, (ch) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function renderDOM(data) {
  document.body.dataset.lang = data.lang || 'zh';
  const statusBar = document.getElementById('status-bar');
  statusBar.innerHTML = data.resources.map(item => `
    <div class="resource">
      <span class="resource-label">${escapeHtml(item.label)}</span>
      <span class="resource-value">${escapeHtml(item.value)}${escapeHtml(item.maxText)}</span>
    </div>
  `).join('');

  document.getElementById('phaseLabel').textContent = data.phaseLabel || '';
  document.getElementById('langBtn').textContent = data.ui.lang;
  document.getElementById('resetBtn').textContent = data.ui.reset;
  document.getElementById('title').textContent = data.title || '';
  document.getElementById('scene').textContent = data.scene || '';
  document.getElementById('goal').textContent = data.goal || '';

  const feedback = document.getElementById('feedback');
  feedback.textContent = data.feedback || '';
  feedback.hidden = !data.feedback;

  const actions = document.getElementById('actions');
  actions.innerHTML = data.actions.map(item => `
    <button class="action ${item.primary ? 'primary' : ''} ${item.enabled ? '' : 'is-disabled'}" ${item.enabled ? '' : 'disabled'} data-id="${escapeHtml(item.id)}">
      <span class="action-main">
        <span class="action-label">${escapeHtml(item.label)}</span>
        <span class="action-kind">${escapeHtml(item.kind)}</span>
      </span>
      ${item.hint ? `<span class="cost">${escapeHtml(item.hint)}</span>` : ''}
    </button>
  `).join('');

  document.getElementById('conceptTitle').textContent = data.ui.concepts;
  document.getElementById('logTitle').textContent = data.ui.log;

  const workersPanel = document.getElementById('workers-panel');
  const workers = document.getElementById('workers');
  workersPanel.hidden = !data.workers.length;
  workers.innerHTML = data.workers.map(item => `
    <div class="worker">
      <span>${escapeHtml(item.name)}</span>
      <span>${escapeHtml(item.task)}</span>
    </div>
  `).join('');

  const log = document.getElementById('log');
  log.innerHTML = data.logs.map(item => `<div class="log-line">${escapeHtml(item.text)}</div>`).join('');
}

function boot() {
  if (!miniProgramPage) throw new Error('Game page was not created.');
  const app = miniProgramPage;
  window.physicsDarkRoom = app;
  app.setData = function (nextData) {
    this.data = { ...(this.data || {}), ...nextData };
    renderDOM(this.data);
  };
  document.getElementById('langBtn').addEventListener('click', () => app.switchLanguage());
  document.getElementById('resetBtn').addEventListener('click', () => app.openResetMenu());
  document.getElementById('actions').addEventListener('click', (event) => {
    const button = event.target.closest('button[data-id]');
    if (!button || button.disabled) return;
    app.handleAction({ currentTarget: { dataset: { id: button.dataset.id } } });
  });
  window.addEventListener('beforeunload', () => app.onHide && app.onHide());
  app.onLoad();
}

document.addEventListener('DOMContentLoaded', boot);
