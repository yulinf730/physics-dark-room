/* Physics Dark Room - Web App build
   Plain-language revision: clearer tutorial, simpler Chinese/English copy, less poetic ambiguity.
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

function showOverlay({ title = '', content = '', html = '', buttons = [] }) {
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
  if (html) {
    const div = document.createElement('div');
    div.className = 'modal-content';
    div.innerHTML = html;
    box.appendChild(div);
  } else if (content) {
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

const STORAGE_KEY = 'physics_darkroom_v5_plain_language'

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
  resetChapter: text('重开本章', 'Restart Chapter'),
  resetAll: text('从头开始', 'Restart All'),
  lang: text('English', '中文'),
  concepts: text('我的发现', 'My Discoveries'),
  log: text('实验记录', 'Experiment Log'),
  complete: text('完成', 'Complete'),
  day: text('', 'Round '),
  roundSuffix: text('轮', ''),
  kinds: {
    theory: text('规律', 'Law'),
    experiment: text('实验', 'Experiment'),
    misconception: text('直觉', 'Intuition'),
    intuition: text('灵感', 'Insight'),
    rest: text('休息', 'Rest')
  },
  resources: {
    energy: text('精力', 'Energy'),
    notes: text('手稿', 'Manuscripts'),
    insight: text('灵感', 'Insight'),
    doubt: text('困惑', 'Doubt')
  },
  resourceDesc: {
    energy: text('行动消耗精力，休息恢复', 'Actions cost energy. Rest to recover.'),
    notes: text('已发现的概念数量', 'Number of concepts discovered.'),
    insight: text('正确直觉获得灵感，解锁深层实验', 'Correct intuition grants insight. Unlocks deeper experiments.'),
    doubt: text('错误直觉增加困惑，过多会阻塞思路', 'Wrong intuition increases doubt. Too much blocks thinking.')
  },
  lowEnergy: text('精力不足。请选择休息来恢复。', 'Not enough energy. Choose rest to recover.'),
  insightLocked: text('需要更多灵感', 'Requires more Insight'),
  doubtConfused: text('疑问太多，思路混乱。先休息，或者做更多实验。', 'Too many questions. Rest or do more experiments.'),
  insightSpark: text('你的疑问开始连成一条线。现在可以把疑问转化成灵感。', 'Your questions are starting to connect. You can turn them into insight.'),
  completeTitle: text('物理世界建立完成', 'The Physics World Is Built'),
  completeScene: text(
    '你从最简单的运动开始，一步一步发现了力、电、磁、热、声、光、相对论、量子和核能。',
    'You started with simple motion and gradually discovered force, electricity, magnetism, heat, sound, light, relativity, quantum physics, and nuclear energy.'
  ),
  completeGoal: text(
    '游戏结束。但物理学真正的问题还在继续：这些知识应该怎样使用？',
    'The game is complete. But the real question remains: how should this knowledge be used?'
  )
}

const TUTORIAL = {
  title: text('怎么玩', 'How to Play'),
  html: text(
    '<p>这是一个通过实验发现物理规律的文字游戏。</p><p>每一轮选择一个行动。</p><p><b>实验</b>会给你记录、灵感或新的疑问。</p><p>当证据足够时，会出现<b>提出规律</b>按钮。点击它进入下一章。</p><p>目标：从简单运动开始，慢慢建立完整的物理世界。</p>',
    '<p>This is a text game about discovering physics through experiments.</p><p>Choose one action each round.</p><p><b>Experiments</b> give you notes, insight, or new questions.</p><p>When you have enough evidence, a <b>Propose a Law</b> button appears. Use it to enter the next chapter.</p><p>Goal: start from simple motion and build a complete picture of physics.</p>'
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
  actionOrder: [],
  complete: false,
  feedback: null,
  logs: [
    {
      time: 0,
      text: text(
        '你在暗室中醒来。桌上有一个苹果、一块木板和一辆小车。你的第一个问题是：运动为什么会改变？',
        'You wake up in a dark room. On the table are an apple, a wooden board, and a small cart. Your first question is: why does motion change?'
      )
    }
  ]
}
const CHAPTERS = [
  {
    title: text("为什么运动会改变？", "Why Does Motion Change?"),
    label: text("第一问", "Q1"),
    question: text("苹果会落下，小车会滑动。物体的运动是自己改变的，还是被力改变的？", "An apple falls, and a cart can slide. Does motion change by itself, or is it changed by force?"),
    scene: text("桌上有一个苹果、一块木板、一颗石子和一辆小车。你要从最简单的运动开始，找出物体为什么会开始运动、改变速度或停下来。", "On the table are an apple, a wooden board, a stone, and a small cart. Start with simple motion and find out why objects start moving, change speed, or stop.")
  },
  {
    title: text("力、质量和加速度", "Force, Mass, and Acceleration"),
    label: text("第二问", "Q2"),
    question: text("如果力会改变运动，那么力、质量和加速度之间有什么关系？", "If force changes motion, how are force, mass, and acceleration related?"),
    scene: text("小车、砝码和计时工具出现在桌上。你要测试：同样的力作用在不同质量的物体上，会产生怎样不同的运动变化。", "A cart, weights, and timing tools appear on the table. Test how the same force changes the motion of objects with different masses.")
  },
  {
    title: text("力总是成对出现吗？", "Do Forces Always Come in Pairs?"),
    label: text("第三问", "Q3"),
    question: text("一个物体推另一个物体时，只有被推的物体受力吗？", "When one object pushes another, is only the second object affected?"),
    scene: text("两辆小车面对面，中间有弹簧和绳子。你要观察碰撞和拉绳，判断力是不是单向发生的。", "Two carts face each other with a spring and a rope nearby. Observe collisions and pulling to decide whether forces act only one way.")
  },
  {
    title: text("苹果和月亮", "The Apple and the Moon"),
    label: text("第四问", "Q4"),
    question: text("苹果会落向地面，月亮却绕着地球。它们可能由同一种力控制吗？", "The apple falls to Earth, while the Moon orbits Earth. Could the same force explain both?"),
    scene: text("星图摊在桌上。你已经理解了地面上的运动，现在要把同样的想法用到天上的月亮。", "A star chart lies on the table. You understand motion on Earth; now apply the same ideas to the Moon.")
  },
  {
    title: text("把力学写成系统", "Build a System of Mechanics"),
    label: text("收束", "Closure"),
    question: text("地上的运动和天上的运动，能不能用同一套规律解释？", "Can motion on Earth and motion in space be explained by the same laws?"),
    scene: text("你的实验记录已经足够多。现在要把运动定律和引力放在一起，形成一套完整的力学体系。", "You now have enough notes. Combine the laws of motion and gravity into one system of mechanics.")
  },
  {
    title: text("看不见的电力", "Invisible Electric Force"),
    label: text("第五问", "Q5"),
    question: text("摩擦后的琥珀能吸起纸屑。不接触也能产生力吗？", "Rubbed amber attracts paper scraps. Can a force act without contact?"),
    scene: text("桌上出现琥珀、毛皮和纸屑。你要研究一种新的力：它看不见，却能隔空影响物体。", "Amber, fur, and paper scraps appear. Study a new force: invisible, but able to act across space.")
  },
  {
    title: text("电流和磁针", "Current and the Compass"),
    label: text("第六问", "Q6"),
    question: text("电流通过导线时，为什么旁边的磁针会转动？", "Why does a compass turn when current flows through a wire?"),
    scene: text("电池、导线和指南针出现在桌上。你要测试电流和磁现象之间是否有关联。", "A battery, a wire, and a compass appear. Test whether electric current and magnetism are connected.")
  },
  {
    title: text("变化产生电", "Change Produces Electricity"),
    label: text("第七问", "Q7"),
    question: text("磁铁靠近线圈时能产生电流。关键是磁铁，还是磁场的变化？", "A magnet near a coil can produce current. Is the key the magnet itself, or the change in magnetic field?"),
    scene: text("线圈、电流表和磁铁出现在桌上。你要观察什么时候有电流，什么时候没有。", "A coil, meter, and magnet appear. Observe when current appears and when it does not.")
  },
  {
    title: text("场和光", "Fields and Light"),
    label: text("第八问", "Q8"),
    question: text("电场和磁场能不能互相产生，并像波一样传播？", "Can electric and magnetic fields produce each other and travel as waves?"),
    scene: text("你开始不只研究物体，也研究空间中的场。现在的问题是：光会不会就是一种电磁波？", "You now study fields in space, not just objects. The question is: could light be an electromagnetic wave?")
  },
  {
    title: text("电的机器", "Electrical Machines"),
    label: text("第九问", "Q9"),
    question: text("电和磁的规律能不能变成真正有用的机器？", "Can the laws of electricity and magnetism become useful machines?"),
    scene: text("桌上有线圈、磁铁、铁芯、转轴和灯泡。你要制造电动机和发电机，看能量怎样转换。", "Coils, magnets, iron cores, axles, and a bulb appear. Build motors and generators to see how energy changes form.")
  },
  {
    title: text("无线传递信息", "Sending Information Without Wires"),
    label: text("第十问", "Q10"),
    question: text("电磁波能不能离开导线，把信息传到远方？", "Can electromagnetic waves leave wires and carry information far away?"),
    scene: text("火花、天线和接收器出现了。你要把电磁波变成可以传递信息的工具。", "Sparks, antennas, and receivers appear. Turn electromagnetic waves into tools for communication.")
  },
  {
    title: text("热和功", "Heat and Work"),
    label: text("第十一问", "Q11"),
    question: text("蒸汽能推动活塞。热是一种物质，还是能量的一种形式？", "Steam can push a piston. Is heat a substance, or a form of energy?"),
    scene: text("水壶、桨叶和蒸汽机模型出现在桌上。你要研究热怎样和机械功互相转化。", "A kettle, paddle wheel, and steam engine model appear. Study how heat and mechanical work transform into each other.")
  },
  {
    title: text("熵和时间方向", "Entropy and the Direction of Time"),
    label: text("第十二问", "Q12"),
    question: text("如果能量守恒，为什么热机还是不能百分百有效？", "If energy is conserved, why can no heat engine be 100% efficient?"),
    scene: text("你已经知道能量不会消失。但热机总会浪费一部分热。现在要研究效率、熵和时间方向。", "You know energy is conserved, but heat engines always waste some heat. Study efficiency, entropy, and the direction of time.")
  },
  {
    title: text("声音是波", "Sound Is a Wave"),
    label: text("第十三问", "Q13"),
    question: text("声音怎样从物体传到耳朵？它是不是一种波？", "How does sound travel from an object to your ear? Is it a wave?"),
    scene: text("音叉、钟罩和共振装置出现了。你要找出声音传播需要什么，以及到底是什么在振动。", "A tuning fork, bell jar, and resonance tools appear. Find out what sound needs to travel and what is vibrating.")
  },
  {
    title: text("光的行为", "The Behavior of Light"),
    label: text("第十四问", "Q14"),
    question: text("光会折射、成像、分色和干涉。它到底怎样传播？", "Light refracts, forms images, splits into colors, and interferes. How does it travel?"),
    scene: text("棱镜、透镜和双缝装置出现在桌上。你要收集证据，判断光是否像波一样传播。", "A prism, lens, and double-slit setup appear. Gather evidence to decide whether light behaves like a wave.")
  },
  {
    title: text("追光问题", "Chasing Light"),
    label: text("第十五问", "Q15"),
    question: text("如果你追着一束光跑，会看到什么？", "What would you see if you chased a beam of light?"),
    scene: text("光速实验和时钟出现在桌上。你要重新思考速度、时间和空间。", "Light-speed experiments and clocks appear. Rethink speed, time, and space.")
  },
  {
    title: text("引力和时空", "Gravity and Spacetime"),
    label: text("第十六问", "Q16"),
    question: text("引力只是普通的力，还是时空本身弯曲的结果？", "Is gravity an ordinary force, or the result of curved spacetime?"),
    scene: text("自由下落的电梯、太阳和星光的图像出现了。你要测试一个新想法：质量会改变时空的形状。", "A falling elevator, the Sun, and starlight diagrams appear. Test a new idea: mass changes the shape of spacetime.")
  },
  {
    title: text("原子里面有什么？", "What Is Inside the Atom?"),
    label: text("第十七问", "Q17"),
    question: text("原子真的是不可分割的小球吗？", "Is the atom really an indivisible small sphere?"),
    scene: text("阴极射线管、金箔和油滴实验装置出现了。你要研究原子内部是否还有更小的结构。", "A cathode ray tube, gold foil, and oil drop setup appear. Study whether atoms contain smaller structures.")
  },
  {
    title: text("能量是一份一份的吗？", "Does Energy Come in Packets?"),
    label: text("第十八问", "Q18"),
    question: text("经典物理解释不了热辐射和光电效应。能量可能不是连续的吗？", "Classical physics cannot explain blackbody radiation and the photoelectric effect. Could energy be non-continuous?"),
    scene: text("黑体辐射和光电效应实验出现了。你要研究光的能量是否是一份一份的。", "Blackbody radiation and photoelectric experiments appear. Study whether light energy comes in packets.")
  },
  {
    title: text("概率的原子世界", "The Probabilistic Atom"),
    label: text("第十九问", "Q19"),
    question: text("电子有确定轨道吗，还是只能用概率描述？", "Do electrons have definite orbits, or can we only describe them with probability?"),
    scene: text("原子光谱、电子波和测量装置出现了。你要研究微观世界为什么不能再用普通轨道来描述。", "Atomic spectra, electron waves, and measuring tools appear. Study why the microscopic world cannot be described with ordinary orbits.")
  },
  {
    title: text("核能和选择", "Nuclear Energy and Choice"),
    label: text("第二十问", "Q20"),
    question: text("如果原子核能裂变，释放出的巨大能量应该怎样使用？", "If nuclei can split and release huge energy, how should that energy be used?"),
    scene: text("云室、铀核和链式反应模型出现了。你要理解核能，也要面对物理知识带来的人类选择。", "A cloud chamber, uranium nucleus, and chain reaction model appear. Understand nuclear energy and the human choices it creates.")
  }
]
const ACTIONS = [
  {
    id: 'watch_apple',
    type: 'experiment',
    chapter: 0,
    label: text('观察苹果：它怎么落下来的？', 'Watch the Apple: How Does It Fall?'),
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.apple = true
      return text(
        '苹果落到地面。你记录：没有支撑时，物体会向下加速。',
        'The apple falls to the ground. You write: without support, an object accelerates downward.'
      )
    }
  },
  {
    id: 'compare_objects',
    type: 'experiment',
    chapter: 0,
    label: text('比较不同物体：石子、木块也这样落吗？', 'Compare: Do Stone and Wood Fall the Same?'),
    hint: text('消耗1精力，获得1记录 疑问1', 'Use 1 Energy. Gain 1 Note., Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.apple,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.manyFall = true
      return text(
        '石子、木块和苹果都会下落。你发现：下落不是苹果特有的现象。',
        'A stone, a wooden block, and an apple all fall. You discover that falling is not special to apples.'
      )
    }
  },
  {
    id: 'build_slope',
    type: 'experiment',
    chapter: 0,
    label: text('搭一个斜面：把下落变慢，仔细看', 'Build an Inclined Plane: Slow Down the Fall'),
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
    cost: 2,
    requires: (s) => s.facts.manyFall,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.slope = true
      return text(
        '斜面让小车慢慢滑下。运动变慢后，你可以更清楚地观察速度怎样变化。',
        'The slope makes the cart move more slowly. When motion is slower, you can observe how speed changes.'
      )
    }
  },
  {
    id: 'wrong_weight',
    type: 'misconception',
    chapter: 0,
    label: text('直觉：重的东西应该落得更快吧？', 'Intuition: Heavier objects fall faster, right?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
    cost: 1,
    requires: (s) => s.facts.apple && !s.facts.manyFall,
    run(s) {
      s.doubt += 1
      s.feedback = text(
        '这个判断太早了。你还没有比较足够多的物体。先做实验，再下结论。',
        'This guess is too early. Compare more objects before making a conclusion.'
      )
      return text(
        '你猜“重的东西一定落得更快”。但现在证据不够，你需要继续比较。',
        'You guess that heavier objects must fall faster. But you do not have enough evidence yet.'
      )
    }
  },
  {
    id: 'wrong_direction_only',
    type: 'intuition',
    chapter: 0,
    label: text('直觉：既然都往下落，也许它们遵循同一条规律？', 'Intuition: They all fall down. Perhaps one law governs them all?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.manyFall && !s.facts.slope,
    run(s) {
      // insight handled by handleAction
      s.feedback = text(
        '反例：石子和木块都向下，只说明方向相同。要判断运动会不会自己改变，还得把运动放慢。',
        'Counterexample: stone and wood both fall downward, but that only tells you the direction. To judge whether motion changes on its own, you need to slow the motion down.'
      )
      return text(
        '“都向下”只说明方向相同，还不能解释运动怎样变化。你需要更多证据。',
        '“They all go down” only describes direction. It does not explain how motion changes.'
      )
    }
  },
  {
    id: 'law_inertia',
    type: 'theory',
    chapter: 0,
    label: text('提出规律：物体不受力时保持静止或匀速直线运动', 'Propose a law: Objects at rest stay at rest; objects in motion stay in motion'),
    hint: text('消耗1精力。需要：斜面 记录3 思路1', 'Use 1 Energy. Requires: inclined plane, Notes 3, Insight 1'),
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
        '你发现了惯性定律：没有外力时，静止的物体保持静止；匀速直线运动的物体继续匀速直线运动。',
        'You discover the first law of motion: unless acted on by a net external force, an object remains at rest or continues moving with constant velocity in a straight line.'
      )
    }
  },
  {
    id: 'push_cart',
    type: 'experiment',
    chapter: 1,
    label: text('轻推小车：力是怎样改变运动的？', 'Nudge the Cart: How Does Force Change Motion?'),
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.facts.push = true
      return text(
        '你轻推小车，小车的速度发生改变。你记录：力会改变物体的运动。',
        'You nudge the cart, and its speed changes. You write: force changes motion.'
      )
    }
  },
  {
    id: 'wrong_push_forever',
    type: 'misconception',
    chapter: 1,
    label: text('直觉：物体要一直推才会动吧？', 'Intuition: Objects need constant push to keep moving?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
    cost: 2,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 2
      s.insight += 1
      s.facts.forceChange = true
      return text(
        '推力越大，小车速度改变得越快。你开始关注“加速度”。',
        'A larger force changes the cart’s speed faster. You begin to focus on acceleration.'
      )
    }
  },
  {
    id: 'add_mass',
    type: 'experiment',
    chapter: 1,
    label: text('给小车加重：质量大了，同样的力效果一样吗？', 'Add Mass: Same Force, Different Effect?'),
    hint: text('消耗1精力，获得1记录 疑问1', 'Use 1 Energy. Gain 1 Note., Doubt +1'),
    cost: 1,
    requires: (s) => s.facts.push,
    once: true,
    run(s) {
      s.records += 1
      s.doubt += 1
      s.facts.mass = true
      return text(
        '小车加重后，同样的推力产生的加速度变小。质量越大，越难改变运动。',
        'With more mass, the same force produces less acceleration. More mass means motion is harder to change.'
      )
    }
  },
  {
    id: 'invent_calculus',
    type: 'experiment',
    chapter: 1,
    label: text('测量：把时间切成无限薄的瞬间', 'Slice Time: Measure Change at Each Instant'),
    hint: text('消耗2精力，获得1灵感，获得1预测', 'Use 2 Energy. Gain 1 Insight and 1 Prediction.'),
    cost: 2,
    requires: (s) => s.facts.forceChange && s.facts.mass,
    once: true,
    run(s) {
      s.insight += 1
      s.predictions += 1
      s.facts.calculus = true
      return text(
        '你把运动分成很短的时间间隔，开始研究每一瞬间速度怎样变化。',
        'You divide motion into very small time intervals and study how speed changes at each instant.'
      )
    }
  },
  {
    id: 'wrong_average_only',
    type: 'misconception',
    chapter: 1,
    label: text('直觉：只要知道平均速度就够了吧？', 'Intuition: Average velocity tells the whole story?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    label: text('提出规律：力等于质量乘以加速度，F=ma', 'Propose a law: Force = mass × acceleration, F=ma'),
    hint: text('消耗1精力。需要：推力 质量 微积分 记录4 思路2', 'Use 1 Energy. Requires: force, mass, calculus, Notes 4, Insight 2'),
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
        '你总结出第二定律：合力等于质量乘以加速度，F = ma。',
        'You discover Newton’s second law: net force equals mass times acceleration, F = ma.'
      )
    }
  },
  {
    id: 'collide_carts',
    type: 'experiment',
    chapter: 2,
    label: text('碰撞实验：两辆小车相撞，各自怎么动？', 'Collision: What Happens to Both Carts?'),
    hint: text('消耗2精力，获得2记录', 'Use 2 Energy. Gain 2 Notes.'),
    cost: 2,
    once: true,
    run(s) {
      s.records += 2
      s.facts.collision = true
      return text(
        '两辆小车相撞后，两个小车的运动都改变了。你记录：相互作用会影响双方。',
        'After two carts collide, both carts change their motion. Interaction affects both objects.'
      )
    }
  },
  {
    id: 'wrong_one_way_force',
    type: 'misconception',
    chapter: 2,
    label: text('直觉：力是单向的，只有一方受力？', 'Intuition: Force goes one way, only one side feels it?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗1精力，获得1记录 思路1', 'Use 1 Energy. Gain 1 Note., Insight +1'),
    cost: 1,
    once: true,
    run(s) {
      s.records += 1
      s.insight += 1
      s.facts.rope = true
      return text(
        '你拉绳子时，绳子也在拉你。力似乎总是成对出现。',
        'When you pull the rope, the rope pulls you back. Forces seem to come in pairs.'
      )
    }
  },
  {
    id: 'measure_pair_force',
    type: 'experiment',
    chapter: 2,
    label: text('测量：绳子两端的力一样大吗？', 'Measure: Are Forces at Both Ends Equal?'),
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：反作用力应该比作用力小吧？', 'Intuition: The reaction force should be weaker?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    label: text('提出规律：作用力与反作用力大小相等、方向相反', 'Propose a law: Equal and opposite reaction'),
    hint: text('消耗1精力。需要：碰撞 拉绳 两端相等 记录5 思路1', 'Use 1 Energy. Requires: collision, rope, equal readings, Notes 5, Insight 1'),
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
        '你发现第三定律：两个物体相互作用时，它们受到大小相等、方向相反的力。',
        'You discover the third law of motion: when two objects interact, they exert equal and opposite forces on each other.'
      )
    }
  },
  {
    id: 'read_moon',
    type: 'experiment',
    chapter: 3,
    label: text('观察月亮：它每晚位置都在变，为什么不掉下来？', 'Study the Moon: Why Does It Not Fall?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
    cost: 1,
    once: true,
    run(s) {
      s.doubt += 1
      s.facts.moon = true
      return text(
        '月亮的方向一直在改变，但它没有撞上地球。你开始怀疑：月亮也许一直在向地球“下落”。',
        'The Moon keeps changing direction but does not hit Earth. You suspect it may be constantly “falling” toward Earth.'
      )
    }
  },
  {
    id: 'wrong_moon_free',
    type: 'intuition',
    chapter: 3,
    label: text('直觉：也许月亮也在"下落"，只是永远落不到地面？', 'Intuition: Perhaps the moon IS falling, just never reaching the ground?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.moon,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得1预测，获得1灵感', 'Use 2 Energy. Gain 1 Prediction and 1 Insight.'),
    cost: 2,
    requires: (s) => s.facts.moon,
    once: true,
    run(s) {
      s.predictions += 1
      s.insight += 1
      s.facts.curve = true
      return text(
        '你画出月亮的弯曲轨道。它一直向地球弯曲运动，但横向速度让它不断错过地球。',
        'You draw the Moon’s curved path. It falls toward Earth, but its sideways speed keeps making it miss.'
      )
    }
  },
  {
    id: 'compare_earth_sky',
    type: 'experiment',
    chapter: 3,
    label: text('比较：苹果的下落和月亮的“下落”是同一回事吗？', 'Compare: Same Force for Apple and Moon?'),
    hint: text('消耗2精力，获得1预测，获得1记录', 'Use 2 Energy. Gain 1 Prediction and 1 Note.'),
    cost: 2,
    requires: (s) => s.facts.curve && s.laws.second,
    once: true,
    run(s) {
      s.records += 1
      s.predictions += 1
      s.facts.sameGravity = true
      return text(
        '你把苹果下落和月亮绕行放在一起比较。它们可能都受到地球引力影响。',
        'You compare the falling apple with the orbiting Moon. Both may be affected by Earth’s gravity.'
      )
    }
  },
  {
    id: 'law_gravity',
    type: 'theory',
    chapter: 3,
    label: text('提出规律：任何两个物体之间都存在引力，与距离平方成反比', 'Propose a law: Universal gravitation; force weakens with distance squared'),
    hint: text('消耗1精力。需要：地月比较 预言2 思路1', 'Use 1 Energy. Requires: Earth–Moon comparison, Predictions 2, Insight 1'),
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
        '你提出万有引力：任何两个有质量的物体都会相互吸引。',
        'You propose universal gravitation: every mass attracts every other mass.'
      )
    }
  },
  {
    id: 'write_principia',
    type: 'theory',
    chapter: 4,
    label: text('总结：把三条定律和万有引力写成完整的理论体系', 'Summarize: Three Laws + Gravity = One System'),
    hint: text('消耗1精力。需要：三定律 万有引力 记录2', 'Use 1 Energy. Requires: three laws, gravity, Notes 2'),
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
    hint: text('消耗1精力，获得1记录 疑问1', 'Use 1 Energy. Gain 1 Note., Doubt +1'),
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
    label: text('直觉：力必须碰到东西才能传过去？', 'Intuition: Force needs contact to be transmitted?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('提出规律：电荷有两种，同种相斥、异种相吸', 'Propose a law: Two kinds of charge; like repels, unlike attracts'),
    hint: text('消耗1精力。需要：吸引排斥 记录3 思路1', 'Use 1 Energy. Requires: attraction and repulsion, Notes 3, Insight 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    label: text('实验：通电导线旁边的磁针会动吗？', 'Experiment: Does Current Affect a Compass?'),
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    type: 'intuition',
    chapter: 6,
    label: text('直觉：也许电和磁之间存在某种联系？', 'Intuition: Perhaps electricity and magnetism are connected?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.current && !s.facts.oersted,
    run(s) {
      // insight handled by handleAction
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
    id: 'law_currentMagnetism',
    type: 'theory',
    chapter: 6,
    label: text('提出规律：电流周围会产生磁场，使磁针偏转', 'Propose a law: Current produces a magnetic field'),
    hint: text('消耗1精力。需要：磁针偏转 记录3 思路1', 'Use 1 Energy. Requires: compass deflection, Notes 3, Insight 1'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：强磁铁放线圈旁边就能一直发电？', 'Intuition: A strong magnet near a coil generates current forever?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗1精力，获得1记录 预言1', 'Use 1 Energy. Gain 1 Note., Prediction +1'),
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
    label: text('提出规律：变化的磁场会在闭合线圈中产生感应电流', 'Propose a law: Changing magnetic field induces current'),
    hint: text('消耗1精力。需要：变化 记录3 思路1 预言1', 'Use 1 Energy. Requires: change, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    type: 'intuition',
    chapter: 8,
    label: text('直觉：也许光就是电磁波？', 'Intuition: Perhaps light IS an electromagnetic wave?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.fields && !s.facts.lightSpeed,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得2预测，获得1灵感', 'Use 2 Energy. Gain 2 Predictions and 1 Insight.'),
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
    label: text('提出规律：变化的电场和磁场互相激发，以光速传播；光就是电磁波', 'Propose a law: Maxwell’s equations; light is an EM wave'),
    hint: text('消耗1精力。需要：场 光速 记录2 思路2 预言2', 'Use 1 Energy. Requires: fields, speed of light, Notes 2, Insight 2, Predictions 2'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：电动机是不是凭空造出了能量？', 'Intuition: Does the motor create energy from nothing?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录 预言1', 'Use 2 Energy. Gain 2 Notes., Prediction +1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    id: 'law_electricPower',
    type: 'theory',
    chapter: 9,
    label: text('提出规律：发电、输电、用电可以组成完整的电力系统', 'Propose a law: Generation + Transmission = Power System'),
    hint: text('消耗1精力。需要：电机 发电机 灯 记录4 思路1 预言1', 'Use 1 Energy. Requires: motor, generator, lamp, Notes 4, Insight 1, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    label: text('直觉：信息必须靠导线才能传过去？', 'Intuition: Signals must travel through wires?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录 预言1', 'Use 2 Energy. Gain 2 Notes., Prediction +1'),
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
    hint: text('消耗1精力，获得1记录 思路1', 'Use 1 Energy. Gain 1 Note., Insight +1'),
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
    label: text('提出规律：信息可以通过调制电磁波，跨越空间无线传输', 'Propose a law: Encode info on EM waves; wireless transmission'),
    hint: text('消耗1精力。需要：天线 调谐 记录3 思路1 预言1', 'Use 1 Energy. Requires: antenna, tuning, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录 疑问1', 'Use 1 Energy. Gain 1 Note., Doubt +1'),
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
    type: 'intuition',
    chapter: 11,
    label: text('直觉：也许热是微观运动的宏观表现？', 'Intuition: Perhaps heat is microscopic motion at the macro scale?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.steam && !s.facts.joule,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    hint: text('消耗1精力，获得1记录 预言1', 'Use 1 Energy. Gain 1 Note., Prediction +1'),
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
    label: text('提出规律：能量既不会创生也不会消失，只能从一种形式转化为另一种', 'Propose a law: Energy is neither created nor destroyed'),
    hint: text('消耗1精力。需要：功热转换 热机 记录3 思路1 预言1', 'Use 1 Energy. Requires: work–heat conversion, engine, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：能不能造一台完全不浪费热量的完美热机？', 'Intuition: Can we build a perfect engine with zero waste?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录 预言1', 'Use 2 Energy. Gain 2 Notes., Prediction +1'),
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
    label: text('提出规律：孤立系统的熵永不减少，熵增给了时间一个方向', 'Propose a law: Entropy never decreases; arrow of time'),
    hint: text('消耗1精力。需要：循环 分子排法 记录3 思路2 预言1', 'Use 1 Energy. Requires: cycle, microstates, Notes 3, Insight 2, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    label: text('直觉：声音是细小粒子从声源飞到耳朵？', 'Intuition: Sound is tiny particles flying from source to ear?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    hint: text('消耗1精力，获得1记录 预言1', 'Use 1 Energy. Gain 1 Note., Prediction +1'),
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
    id: 'law_sound',
    type: 'theory',
    chapter: 13,
    label: text('提出规律：声音是介质中的机械波，有频率、波长和振幅', 'Propose a law: Sound is a mechanical wave'),
    hint: text('消耗1精力。需要：空气 共振 记录3 思路1 预言1', 'Use 1 Energy. Requires: air, resonance, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    label: text('直觉：颜色是棱镜“制造”出来的？', 'Intuition: Does the prism create colors?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗1精力，获得1记录 预言1', 'Use 1 Energy. Gain 1 Note., Prediction +1'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('提出规律：光是一种波，会折射、成像、分色、干涉和衍射', 'Propose a law: Light is a wave; refraction, interference, diffraction'),
    hint: text('消耗1精力。需要：光谱 透镜 干涉 记录3 思路1 预言1', 'Use 1 Energy. Requires: spectrum, lens, interference, Notes 3, Insight 1, Prediction 1'),
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
    label: text('思考实验：如果你追着一束光跑，会发生什么？', 'Thought experiment: What If You Chase Light?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    type: 'intuition',
    chapter: 15,
    label: text('直觉：也许光不需要介质也能传播？', 'Intuition: Perhaps light needs no medium to travel?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.lightPuzzle && !s.facts.michelsonMorley,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    hint: text('消耗2精力，获得2记录 预言1', 'Use 2 Energy. Gain 2 Notes., Prediction +1'),
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
    id: 'law_specialRelativity',
    type: 'theory',
    chapter: 15,
    label: text('提出规律：光速不变，空间和时间是相对的，E=mc²', 'Propose a law: Light speed constant; relativity; E=mc²'),
    hint: text('消耗1精力。需要：无以太 同时性 记录3 思路1 预言1', 'Use 1 Energy. Requires: no ether wind, simultaneity, Notes 3, Insight 1, Prediction 1'),
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
    label: text('思考实验：在自由下落的电梯里，引力还在吗？', 'Thought experiment: Gravity in a Falling Elevator?'),
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：引力就是一种普通力，跟时空没关系？', 'Intuition: Gravity is just an ordinary force, unrelated to spacetime?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    label: text('预测：太阳的质量会让经过的星光弯曲吗？', 'Predict: Does the Sun Bend Starlight?'),
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
    label: text('验证：日食时观测星光是否真的偏折了', 'Verify: Observe Starlight During an Eclipse'),
    hint: text('消耗1精力，获得1记录 思路1', 'Use 1 Energy. Gain 1 Note., Insight +1'),
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
    id: 'law_generalRelativity',
    type: 'theory',
    chapter: 16,
    label: text('提出规律：物质弯曲时空，弯曲的时空决定物质的运动——引力就是几何', 'Propose a law: Mass curves spacetime; gravity is geometry'),
    hint: text('消耗1精力。需要：电梯 偏折观测 记录3 思路2 预言2', 'Use 1 Energy. Requires: falling elevator, light bending, Notes 3, Insight 2, Predictions 2'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    type: 'intuition',
    chapter: 17,
    label: text('直觉：也许原子内部还有结构？', 'Intuition: Perhaps atoms have internal structure?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.electron && !s.facts.nucleus,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    hint: text('消耗1精力，获得1记录 预言1', 'Use 1 Energy. Gain 1 Note., Prediction +1'),
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
    id: 'law_atom',
    type: 'theory',
    chapter: 17,
    label: text('提出规律：原子有核，电子在外，电荷有最小单位', 'Propose a law: Nucleus + electrons; discrete charge'),
    hint: text('消耗1精力。需要：电子 原子核 电荷量子 记录3 思路1 预言1', 'Use 1 Energy. Requires: electron, nucleus, quantized charge, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    label: text('直觉：能量应该像水流一样连续吧？', 'Intuition: Energy must flow continuously like water?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录 预言1', 'Use 2 Energy. Gain 2 Notes., Prediction +1'),
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
    label: text('提出规律：光是一份一份的能量包，E=hν', 'Propose a law: Light = energy packets; E=hν'),
    hint: text('消耗1精力。需要：黑体 光电效应 记录3 思路1 预言1', 'Use 1 Energy. Requires: blackbody radiation, photoelectric effect, Notes 3, Insight 1, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    type: 'intuition',
    chapter: 19,
    label: text('直觉：也许电子的运动方式完全不同？', 'Intuition: Perhaps electrons move in a completely different way?'),
    hint: text('顺着直觉探索，可能获得灵感', 'Follow your intuition. May gain insight.'),
    cost: 1,
    requires: (s) => s.facts.spectralLines && !s.facts.matterWave,
    run(s) {
      // insight handled by handleAction
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
    hint: text('消耗2精力，获得2记录，获得1灵感 预言1', 'Use 2 Energy. Gain 2 Notes and 1 Insight., Prediction +1'),
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
    hint: text('消耗1精力，获得1记录 思路1', 'Use 1 Energy. Gain 1 Note., Insight +1'),
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
    id: 'law_quantum',
    type: 'theory',
    chapter: 19,
    label: text('提出规律：粒子状态由波函数描述，只能计算概率，不能确定轨道', 'Propose a law: Wavefunctions give probabilities, not orbits'),
    hint: text('消耗1精力。需要：物质波 不确定性 记录3 思路2 预言1', 'Use 1 Energy. Requires: matter waves, uncertainty, Notes 3, Insight 2, Prediction 1'),
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
    hint: text('消耗1精力，获得1记录', 'Use 1 Energy. Gain 1 Note.'),
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
    label: text('直觉：原子核应该是永恒不变的吧？', 'Intuition: The nucleus is eternal and unchanging?'),
    hint: text('顺着直觉探索，可能增加困惑', 'Follow your intuition. May increase doubt.'),
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
    hint: text('消耗2精力，获得2记录，获得1灵感', 'Use 2 Energy. Gain 2 Notes and 1 Insight.'),
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
    hint: text('消耗2精力，获得2记录 预言2', 'Use 2 Energy. Gain 2 Notes., Predictions +2'),
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
    id: 'law_nuclearAge',
    type: 'theory',
    chapter: 20,
    label: text('提出规律：核能可以发电也可以造武器——物理学走到了人类选择的十字路口', 'Propose a law: Nuclear energy; physics at a crossroads'),
    hint: text('消耗1精力。需要：裂变 链式反应 记录4 思路1 预言2', 'Use 1 Energy. Requires: fission, chain reaction, Notes 4, Insight 1, Predictions 2'),
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
  { key: 'inertia', name: text('第一定律', 'First Law of Motion'), task: text('惯性', 'Inertia'), chain: ['build_slope', 'watch_apple', 'compare_objects', 'law_inertia'] },
  { key: 'second', name: text('第二定律', 'Second Law of Motion'), task: text('F = ma', 'F = ma'), chain: ['push_cart', 'vary_force', 'add_mass', 'invent_calculus', 'law_second'] },
  { key: 'third', name: text('第三定律', 'Third Law of Motion'), task: text('相互作用', 'Interaction'), chain: ['collide_carts', 'pull_rope', 'measure_pair_force', 'law_third'] },
  { key: 'gravity', name: text('万有引力', 'Universal Gravitation'), task: text('地月同律', 'Earth and Moon'), chain: ['read_moon', 'estimate_curve', 'compare_earth_sky', 'law_gravity'] },
  { key: 'principia', name: text('《原理》', 'Principia'), task: text('经典力学', 'Classical mechanics'), chain: ['law_inertia', 'law_second', 'law_third', 'law_gravity', 'write_principia'] },
  { key: 'charge', name: text('电荷', 'Charge'), task: text('吸引与排斥', 'Attraction and repulsion'), chain: ['rub_amber', 'compare_charges', 'law_charge'] },
  { key: 'currentMagnetism', name: text('电流磁效应', 'Magnetic Effect of Current'), task: text('电生磁', 'Current produces magnetism'), chain: ['close_circuit', 'compass_near_wire', 'law_currentMagnetism'] },
  { key: 'induction', name: text('电磁感应', 'Electromagnetic Induction'), task: text('变化生电', 'Change produces current'), chain: ['move_magnet_coil', 'reverse_motion', 'law_induction'] },
  { key: 'maxwell', name: text('麦克斯韦方程', 'Maxwell\u2019s Equations'), task: text('光是电磁波', 'Light is an EM wave'), chain: ['draw_fields', 'measure_wave_speed', 'law_maxwell'] },
  { key: 'electricPower', name: text('电力系统', 'Electric Power'), task: text('电机与灯', 'Motors and lamps'), chain: ['spin_motor', 'turn_generator', 'light_filament', 'law_electricPower'] },
  { key: 'radio', name: text('无线电', 'Radio'), task: text('远距离通信', 'Long-distance signals'), chain: ['spark_gap', 'build_antenna', 'tune_receiver', 'law_radio'] },
  { key: 'energy', name: text('能量守恒', 'Conservation of Energy'), task: text('功热互换', 'Work and heat'), chain: ['heat_water', 'turn_paddle', 'build_heat_engine', 'law_energy'] },
  { key: 'entropy', name: text('熵增方向', 'Entropy'), task: text('时间箭头', 'Arrow of time'), chain: ['watch_waste_heat', 'trace_carnot_cycle', 'count_microstates', 'law_entropy'] },
  { key: 'sound', name: text('声波', 'Sound Waves'), task: text('空气振动', 'Air vibration'), chain: ['strike_tuning_fork', 'bell_jar', 'map_resonance', 'law_sound'] },
  { key: 'optics', name: text('波动光学', 'Wave Optics'), task: text('干涉成像', 'Interference and imaging'), chain: ['pass_prism', 'focus_lens', 'make_interference', 'law_optics'] },
  { key: 'specialRelativity', name: text('狭义相对论', 'Special Relativity'), task: text('光速不变', 'Invariant light speed'), chain: ['chase_light', 'michelson_morley', 'sync_clocks', 'law_specialRelativity'] },
  { key: 'generalRelativity', name: text('广义相对论', 'General Relativity'), task: text('弯曲时空', 'Curved spacetime'), chain: ['falling_elevator', 'predict_light_bending', 'observe_eclipse', 'law_generalRelativity'] },
  { key: 'atom', name: text('原子结构', 'Atomic Structure'), task: text('电子与原子核', 'Electron and nucleus'), chain: ['cathode_ray', 'gold_foil', 'oil_drop', 'law_atom'] },
  { key: 'quanta', name: text('光量子', 'Light Quanta'), task: text('能量分份', 'Discrete energy packets'), chain: ['blackbody', 'photoelectric', 'law_quanta'] },
  { key: 'quantum', name: text('量子力学', 'Quantum Mechanics'), task: text('概率与不确定性', 'Probability and uncertainty'), chain: ['spectral_lines', 'matter_wave', 'uncertainty', 'law_quantum'] },
  { key: 'nuclearAge', name: text('核时代', 'Nuclear Age'), task: text('裂变与责任', 'Fission and responsibility'), chain: ['cloud_chamber', 'split_uranium', 'chain_reaction', 'law_nuclearAge'] }
]

const FACT_CONCEPTS = [
  { key: 'calculus', name: text('微积分', 'Calculus'), task: text('计算瞬时变化', 'Instant change'), chain: ['invent_calculus'] },
  { key: 'fields', name: text('场', 'Field'), task: text('空间有结构', 'Structured space'), chain: ['draw_fields'] },
  { key: 'motor', name: text('电动机', 'Motor'), task: text('电转成运动', 'Electricity to motion'), chain: ['spin_motor'] },
  { key: 'bulb', name: text('灯泡', 'Lamp'), task: text('电转成光', 'Electricity to light'), chain: ['light_filament'] },
  { key: 'engine', name: text('热机', 'Heat Engine'), task: text('热推动机器', 'Heat drives machines'), chain: ['build_heat_engine'] },
  { key: 'resonance', name: text('共振', 'Resonance'), task: text('频率选择', 'Frequency selection'), chain: ['map_resonance'] },
  { key: 'spectrum', name: text('光谱', 'Spectrum'), task: text('颜色在光中', 'Colors in light'), chain: ['pass_prism'] },
  { key: 'curvedSpacetime', name: text('时空弯曲', 'Curved Spacetime'), task: text('光路偏折', 'Bent light paths'), chain: ['predict_light_bending'] },
  { key: 'electron', name: text('电子', 'Electron'), task: text('原子可分', 'Atoms have parts'), chain: ['cathode_ray'] },
  { key: 'nucleus', name: text('原子核', 'Nucleus'), task: text('小而重的中心', 'Small heavy center'), chain: ['gold_foil'] },
  { key: 'matterWave', name: text('物质波', 'Matter Wave'), task: text('电子也有波', 'Electrons have wave behavior'), chain: ['matter_wave'] },
  { key: 'fission', name: text('裂变', 'Fission'), task: text('质量变能量', 'Mass-energy conversion'), chain: ['split_uranium'] }
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

// 检查action是否因灵感不足而无法执行
function isInsightBlocked(state, action) {
  if (action.type === 'theory') return false
  if (!action.requires) return false
  if (canRun(state, action)) return false
  // 尝试不带灵感要求检查
  const saved = state.insight
  state.insight = INSIGHT_REQUIRE + 1
  const result = canRun(state, action)
  state.insight = saved
  return !result
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
  law_currentMagnetism: text('电流通过导线时会在周围产生磁场', 'An electric current flowing through a wire creates a magnetic field around it'),
  law_induction: text('变化的磁场会在导体中产生感应电动势', 'A changing magnetic field induces an electromotive force in a conductor'),
  law_maxwell: text('电场和磁场相互激发，形成电磁波以光速传播', 'Electric and magnetic fields generate each other, forming electromagnetic waves traveling at light speed'),
  law_electricPower: text('利用电磁感应原理将机械能转化为电能', 'Convert mechanical energy into electrical energy using electromagnetic induction'),
  law_radio: text('利用电磁波在空间中传输信息', 'Use electromagnetic waves to transmit information through space'),
  law_energy: text('能量不会凭空产生或消失，只会从一种形式转化为另一种', 'Energy cannot be created or destroyed, only transformed from one form to another'),
  law_entropy: text('孤立系统的熵永不减少，自然过程有方向性', 'The entropy of an isolated system never decreases; natural processes have direction'),
  law_sound: text('声音是介质中传播的机械纵波', 'Sound is a mechanical longitudinal wave propagating through a medium'),
  law_optics: text('光是一种电磁波，可解释干涉、衍射等现象', 'Light is an electromagnetic wave, explaining interference and diffraction'),
  law_specialRelativity: text('物理定律在所有惯性系中相同，光速不变', 'The laws of physics are the same in all inertial frames; the speed of light is constant'),
  law_generalRelativity: text('引力是时空弯曲的表现，物质告诉时空如何弯曲', 'Gravity is the curvature of spacetime; matter tells spacetime how to curve'),
  law_atom: text('原子由原子核和绕核运动的电子组成', 'Atoms consist of a nucleus surrounded by orbiting electrons'),
  law_quanta: text('光以离散的能量包（光子）形式存在 E=hν', 'Light exists as discrete packets of energy (photons) E=hν'),
  law_quantum: text('微观粒子具有波粒二象性，由波函数描述', 'Microscopic particles exhibit wave-particle duality, described by wave functions'),
  law_nuclearAge: text('原子核可以裂变或聚变，释放巨大能量', 'Atomic nuclei can undergo fission or fusion, releasing enormous energy')
}

const THEORY_TOASTS = {
  law_inertia: text('恭喜你，你已经提出了牛顿第一运动定律。', 'You have discovered Newton’s first law of motion.'),
  law_second: text('恭喜你，你已经总结出牛顿第二运动定律。', 'You have discovered Newton’s second law of motion.'),
  law_third: text('恭喜你，你已经总结出牛顿第三运动定律。', 'You have discovered Newton’s third law of motion.'),
  law_gravity: text('恭喜你，你已经提出了万有引力定律。', 'You have proposed the law of universal gravitation.'),
  write_principia: text('恭喜你，你已经写成《自然哲学的数学原理》。', 'You have written the Principia.'),
  law_charge: text('恭喜你，你已经定义了电荷概念。', 'You have defined electric charge.'),
  law_currentMagnetism: text('恭喜你，你已经发现了电流的磁效应。', 'You have discovered the magnetic effect of electric current.'),
  law_induction: text('恭喜你，你已经发现了电磁感应：变化的磁通量会产生感应电动势。', 'You have discovered electromagnetic induction: a changing magnetic flux induces an emf.'),
  law_maxwell: text('恭喜你，你已经写下了麦克斯韦方程组。', 'You have written Maxwell’s equations.'),
  law_electricPower: text('恭喜你，你已经搭建出电力系统的基本图景。', 'You have built the basic picture of an electric power system.'),
  law_radio: text('恭喜你，你已经实现了无线通信。', 'You have established wireless communication.'),
  law_energy: text('恭喜你，你已经总结出能量守恒定律。', 'You have discovered the law of conservation of energy.'),
  law_entropy: text('恭喜你，你已经认识到熵增给出了自然过程的方向。', 'You have discovered the entropy principle: natural processes have a direction.'),
  law_sound: text('恭喜你，你已经理解：声音是一种机械波。', 'You now understand that sound is a mechanical wave.'),
  law_optics: text('恭喜你，你已经建立了光的波动图像。', 'You have established the wave model of light.'),
  law_specialRelativity: text('恭喜你，你已经建立了狭义相对论。', 'You have established special relativity.'),
  law_generalRelativity: text('恭喜你，你已经建立了广义相对论。', 'You have established general relativity.'),
  law_atom: text('恭喜你，你已经发现了原子结构。', 'You have discovered atomic structure.'),
  law_quanta: text('恭喜你，你已经提出了光量子。', 'You have discovered light quanta.'),
  law_quantum: text('恭喜你，你已经建立了量子力学。', 'You have established quantum mechanics.'),
  law_nuclearAge: text('恭喜你，你已经进入了核时代。', 'You have entered the nuclear age.')
}

function theoryToastText(action, lang) {
  if (THEORY_TOASTS[action.id]) return pick(THEORY_TOASTS[action.id], lang)

  const label = pick(action.label, lang)
  if (lang === 'zh') {
    return `你提出了新的规律：${label}。`
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
  return `You have proposed a new law: ${label}.`
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
    if (!wx.getStorageSync('physics_darkroom_tutorial_seen_v1')) {
      wx.setStorageSync('physics_darkroom_tutorial_seen_v1', true)
      const lang = this.state.lang || 'zh'
      showOverlay({
        title: pick(TUTORIAL.title, lang),
        html: pick(TUTORIAL.html, lang),
        buttons: [{ text: pick(text('开始游戏', 'Start'), lang), primary: true }]
      })
    }
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
    // Clean up actionOrder: remove actions from cleared chapters
    if (this.state.actionOrder) {
      const clearedKeys = []
      for (let i = chapter; i < CHAPTERS.length; i++) {
        clearedKeys.push(...(CHAPTER_FACT_KEYS[i] || []), ...(CHAPTER_LAW_KEYS[i] || []))
      }
      this.state.actionOrder = this.state.actionOrder.filter((id) => !clearedKeys.includes(id))
    }
    this.log(text(
      '你重开了本章。前面已经发现的规律仍然保留。',
      'You restarted this chapter. Earlier discoveries remain.'
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
    if (id === 'insight_spark') {
      // 灵光乍现：困惑化为灵感突破
      s.doubt -= 2
      s.insight += 2
      this.log(text(
        '你把那些无处安放的困惑翻过来，发现它们指向了同一个方向。疑虑不再是阻碍，而是路标。',
        'You turn your restless doubts over and find they all point the same way. Confusion is no longer an obstacle; it becomes a signpost.'
      ))
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
    // Track action order for discovery timeline
    if (!s.actionOrder) s.actionOrder = []
    if (!s.actionOrder.includes(id)) s.actionOrder.push(id)

    // Successful experiment may reduce doubt
    if (action.type === 'experiment' && s.doubt > 0) {
      s.doubt -= 1
    }
    // Misconception increases doubt, intuition increases insight
    if (action.type === 'misconception') {
      s.doubt += 1
    }
    if (action.type === 'intuition') {
      s.insight += 1
    }

    this.log(message)
    this.afterChange()
  },

  discoverTheory(action) {
    const cost = THEORY_ENERGY_COST
    this.state.energy -= cost
    const message = action.run(this.state)
    // Track theory in action order
    const s = this.state
    if (!s.actionOrder) s.actionOrder = []
    if (!s.actionOrder.includes(action.id)) s.actionOrder.push(action.id)
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
    const sparking = s.doubt >= DOUBT_LOCK && s.insight >= INSIGHT_SPARK

    const chapterActions = ACTIONS
      .filter((action) => action.chapter === s.chapter)
      .filter((action) => action.type !== 'theory')
      .filter((action) => !action.visible || action.visible(s))
      .filter((action) => !action.once || !s.facts[action.id])
      .map((action) => {
        const blocked = confused || isInsightBlocked(s, action)
        return {
          id: action.id,
          label: pick(action.label, lang),
          hint: pick(action.hint, lang),
          kind: actionKind(action, lang),
          primary: action.type === 'theory',
          type: action.type,
          enabled: !blocked && Boolean(canRun(s, action)),
          locked: blocked
            ? confused
              ? pick(UI.doubtConfused, lang)
              : pick(text('灵感不足，需要更多思考', 'Not enough insight. Think more.'), lang)
            : ''
        }
      })

    const enabledExperiments = chapterActions.filter((a) => a.enabled && (a.type === 'experiment' || a.type === 'intuition'))
    const enabledMisconceptions = chapterActions.filter((a) => a.enabled && a.type === 'misconception')
    const visible = []

    if (enabledExperiments[0]) visible.push(enabledExperiments[0])
    if (enabledMisconceptions[0]) visible.push(enabledMisconceptions[0])
    if (enabledExperiments[1]) visible.push(enabledExperiments[1])

    // 灵光乍现：困惑高但灵感足够时出现特殊选项
    if (sparking) {
      visible.push({
        id: 'insight_spark',
        label: pick(text('将困惑化为方向', 'Transform Doubt Into Direction'), lang),
        hint: pick(text('灵感 ≥ 3，困惑 ≥ 5：把疑虑化为突破的线索', 'Doubt becomes a clue for breakthrough'), lang),
        kind: pick(text('灵感', 'Spark'), lang),
        primary: false,
        enabled: true,
        locked: ''
      })
    }

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
        log: pick(UI.log, lang),
        resourceDesc: {
          energy: lang === 'zh' ? '精力：每回合消耗1点，理论消耗2点。休息可恢复。归零时只能休息。' : 'Energy: 1 per action, 2 per theory. Rest to recover. Must rest at 0.',
          notes: lang === 'zh' ? '手稿：已发现的概念总数，代表你的探索进度。' : 'Notes: Total concepts discovered. Your exploration progress.',
          insight: lang === 'zh' ? '灵感：正确直觉+1，解锁隐藏选项。灵感≥3且困惑≥5时触发灵光乍现。' : 'Insight: +1 from correct intuition. Unlocks hidden options. Spark at ≥3 with doubt≥5.',
          doubt: lang === 'zh' ? '困惑：错误直觉+1。困惑≥5且灵感<2时选项被锁定。' : 'Doubt: +1 from wrong intuition. Options locked at ≥5 with insight<2.'
        }
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
    const s = this.state
    const facts = FACT_CONCEPTS
      .filter((fact) => s.facts[fact.key])
      .map((fact) => ({
        key: fact.key,
        name: pick(fact.name, lang),
        task: pick(fact.task, lang),
        chain: fact.chain || [],
        discovered: true
      }))
    const laws = LAW_LIST
      .filter((law) => s.laws[law.key])
      .map((law) => ({
        key: law.key,
        name: pick(law.name, lang),
        task: pick(law.task, lang),
        chain: law.chain || [],
        discovered: true
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
  statusBar.innerHTML = data.resources.map(item => {
    const desc = data.ui.resourceDesc ? data.ui.resourceDesc[item.key] || '' : '';
    return `
    <div class="resource" title="${escapeHtml(desc)}">
      <span class="resource-label">${escapeHtml(item.label)}</span>
      <span class="resource-value">${escapeHtml(item.value)}${escapeHtml(item.maxText)}</span>
    </div>`;
  }).join('');

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
      </span>
      ${item.hint ? `<span class="cost">${escapeHtml(item.hint)}</span>` : ''}
    </button>
  `).join('');

  document.getElementById('conceptTitle').textContent = data.ui.concepts;
  document.getElementById('logTitle').textContent = data.ui.log;

  const workersPanel = document.getElementById('workers-panel');
  const workers = document.getElementById('workers');
  workersPanel.hidden = !data.workers.length;
  workers.innerHTML = data.workers.map((item, idx) => `
    <div class="worker" data-worker-idx="${idx}">
      <span class="worker-name">${escapeHtml(item.name)}</span>
      <span class="worker-task">${escapeHtml(item.task)}</span>
    </div>
  `).join('');

  const log = document.getElementById('log');
  log.innerHTML = data.logs.map(item => `<div class="log-line">${escapeHtml(item.text)}</div>`).join('');
}


function showDiscoveryTimeline(item, state, lang) {
  const chain = item.chain || []
  const actionOrder = state.actionOrder || []
  const facts = state.facts || {}
  const laws = state.laws || {}

  // Build timeline steps
  const steps = chain.map((actionId) => {
    const action = ACTIONS.find((a) => a.id === actionId)
    const label = action ? pick(action.label, lang) : actionId
    const isTheory = action && action.type === 'theory'
    // Check if step is completed
    let completed = false
    if (isTheory) {
      // Map action ID to law key: law_inertia -> inertia, write_principia -> principia
      let lawKey = actionId
      if (actionId.startsWith('law_')) lawKey = actionId.slice(4)
      else if (actionId === 'write_principia') lawKey = 'principia'
      completed = !!laws[lawKey]
    } else {
      completed = !!facts[actionId]
    }
    // Determine order in player's actual sequence
    const orderIdx = actionOrder.indexOf(actionId)
    return { label, isTheory, completed, orderIdx, actionId }
  })

  // Find the theory definition for this concept
  let theoryDef = ''
  const theoryStep = steps.find((s) => s.isTheory)
  if (theoryStep && THEORY_DEFS[theoryStep.actionId]) {
    theoryDef = pick(THEORY_DEFS[theoryStep.actionId], lang)
  }

  // Build HTML
  let html = '<div class="timeline">'
  steps.forEach((step, i) => {
    const isLast = i === steps.length - 1
    const dotClass = step.completed ? 'tl-dot-done' : 'tl-dot-pending'
    const labelClass = step.completed
      ? (step.isTheory ? 'tl-label-theory' : 'tl-label-done')
      : 'tl-label-pending'
    const orderText = step.completed && step.orderIdx >= 0
      ? `<span class="tl-order">#${step.orderIdx + 1}</span>`
      : ''

    html += `<div class="tl-step">
      <div class="tl-line-col">
        <span class="tl-dot ${dotClass}"></span>
        ${isLast ? '' : '<span class="tl-line"></span>'}
      </div>
      <div class="tl-body">
        <span class="${labelClass}">${escapeHtml(step.label)}</span>
        ${orderText}
      </div>
    </div>`
  })
  html += '</div>'

  if (theoryDef) {
    html += `<div class="tl-definition">${escapeHtml(theoryDef)}</div>`
  }

  showOverlay({
    title: item.name,
    html,
    buttons: [{ text: lang === 'zh' ? '关闭' : 'Close', primary: true }]
  })
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
  document.getElementById('workers').addEventListener('click', (event) => {
    const worker = event.target.closest('.worker');
    if (!worker) return;
    const idx = parseInt(worker.dataset.workerIdx, 10);
    const item = app.data.workers[idx];
    if (!item) return;
    showDiscoveryTimeline(item, app.state, app.data.lang);
  });
  window.addEventListener('beforeunload', () => app.onHide && app.onHide());
  app.onLoad();
}

document.addEventListener('DOMContentLoaded', boot);
