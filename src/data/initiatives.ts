export interface Initiative {
    id: string
    title: string
    category: string
    image: string
    description: string
    content: string
}

export const initiatives: Initiative[] = [
    {
        id: 'winter-relief-drive',
        title: 'Winter Relief Drive',
        category: 'Community',
        image: 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=1200&h=800&fit=crop&q=80',
        description: 'Providing warmth and essential supplies to the underprivileged during the harsh winter season.',
        content: `
            <p>The Winter Relief Drive is one of our flagship community service initiatives aimed at supporting vulnerable populations during the severe cold months in Delhi. Each year, thousands of people living on the streets or in inadequate shelters face life-threatening conditions due to the dropping temperatures.</p>
            
            <h3>Our Impact</h3>
            <p>Since its inception, the drive has reached over 5,000 families across North and East Delhi. We distribute:</p>
            <ul>
                <li>Heavy woollen blankets</li>
                <li>Warm clothing (jackets, sweaters, gloves)</li>
                <li>Sleeping bags for the homeless</li>
                <li>Hot nutritious meals</li>
            </ul>

            <h3>How We Work</h3>
            <p>Our volunteers conduct surveys in target areas to identify the most needy individuals and families. Distribution drives are organized late at night and early mornings to reach those sleeping on pavements. We strictly maintain dignity and order during the distribution process.</p>
            
            <p>Join us in this noble cause. Your contribution can start with donating old clothes or volunteering your time for a distribution drive.</p>
        `
    },
    {
        id: 'scholarship-expo-2025',
        title: 'Scholarship Expo 2025',
        category: 'Education',
        image: 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=1200&h=800&fit=crop&q=80',
        description: 'Connecting students with educational opportunities and financial aid resources.',
        content: `
            <p>Access to quality education should not be limited by financial constraints. The Scholarship Expo 2025 is a dedicated event designed to bridge the gap between deserving students and available scholarship opportunities.</p>

            <h3>Event Highlights</h3>
            <p>The expo brings together representatives from government bodies, private foundations, and international universities to provide direct information and guidance to students.</p>
            <ul>
                <li><strong>Workshops:</strong> How to write winning scholarship essays.</li>
                <li><strong>Application Desks:</strong> On-spot assistance for filing government scholarship forms.</li>
                <li><strong>Counseling:</strong> One-on-one sessions with career counselors.</li>
            </ul>

            <p>Last year's expo helped secure funding for over 200 students pursuing higher education in various fields including Engineering, Medicine, and Humanities.</p>
        `
    },
    {
        id: 'clean-yamuna-campaign',
        title: 'Clean Yamuna Campaign',
        category: 'Environment',
        image: 'https://images.unsplash.com/photo-1618477461853-5f8dd1219df4?w=1200&h=800&fit=crop&q=80',
        description: 'A student-led movement to restore the ecological balance of the Yamuna river.',
        content: `
            <p>The Yamuna river is the lifeline of Delhi, yet it faces severe pollution challenges. The Clean Yamuna Campaign is our ongoing effort to raise awareness and take direct action towards river restoration.</p>

            <h3>Our Activities</h3>
            <p>We organize weekly cleanup drives at various ghats, involving students from colleges across the city. Beyond cleaning, we focus on:</p>
            <ul>
                <li><strong>Awareness Marches:</strong> Educating citizens about waste segregation and stopping idol immersion.</li>
                <li><strong>Policy Advocacy:</strong> Submitting student-drafted white papers to the local administration.</li>
                <li><strong>Plantation Drives:</strong> Planting native trees along the river banks to prevent soil erosion.</li>
            </ul>

            <p>Be part of the solution. Let's work together to bring life back to our river.</p>
        `
    },
    {
        id: 'student-parliament',
        title: 'Student Parliament',
        category: 'Leadership',
        image: 'https://images.unsplash.com/photo-1555817443-4ccac8d5b464?w=1200&h=800&fit=crop&q=80',
        description: 'Simulating democratic processes to groom future leaders and policy makers.',
        content: `
            <p>The Student Parliament is an academic simulation of the Indian legislative system. It provides a platform for students to debate public issues, draft bills, and understand the intricacies of parliamentary procedures.</p>

            <h3>Objectives</h3>
            <ul>
                <li>To instill democratic values and constitutional knowledge among youth.</li>
                <li>To develop public speaking, critical thinking, and negotiation skills.</li>
                <li>To encourage political participation and awareness.</li>
            </ul>

            <p>Participants take on roles of ministers and opposition leaders, debating current national issues. The event is judged by retired civil servants and political science professors.</p>
        `
    },
    {
        id: 'career-guidance-fair',
        title: 'Career Guidance Fair',
        category: 'Workshop',
        image: 'https://images.unsplash.com/photo-1544531696-608b6b1502f0?w=1200&h=800&fit=crop&q=80',
        description: 'Expert counseling to help students navigate their professional paths.',
        content: `
            <p>Choosing a career is one of the most critical decisions in a student's life. Our Career Guidance Fair offers comprehensive support to help students make informed choices.</p>

            <h3>What to Expect</h3>
            <ul>
                <li><strong>Psychometric Testing:</strong> Scientific assessment of aptitude and interests.</li>
                <li><strong>Industry Panels:</strong> Talks by professionals from IT, Law, Media, Civil Services, and Entrepreneurship.</li>
                <li><strong>Skill Workshops:</strong> CV writing, interview preparation, and soft skills training.</li>
            </ul>
        `
    },
    {
        id: 'youth-leadership-camp',
        title: 'Youth Leadership Camp',
        category: 'Training',
        image: 'https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=1200&h=800&fit=crop&q=80',
        description: 'A residential camp focused on holistic personality development and moral training.',
        content: `
            <p>The Youth Leadership Camp is a 3-day residential program held annually at an outstation location. It is designed to disconnect youth from the digital noise and reconnect them with their purpose and community.</p>

            <h3>Camp Modules</h3>
            <ul>
                <li><strong>Physical Fitness:</strong> Morning sports and trekking.</li>
                <li><strong>Intellectual Sessions:</strong> Discussions on history, philosophy, and social issues.</li>
                <li><strong>Team Building:</strong> Group tasks and problem-solving challenges.</li>
                <li><strong>Spiritual Development:</strong> Reflection and character building sessions.</li>
            </ul>
        `
    },
]
