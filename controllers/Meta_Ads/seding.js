import axios from 'axios';
const data = [
    {
      "lead_id": "1585181152715220",
      "name": "Charu Tiwari",
      "phone_number": "9451802407",
      "email": "chitranshitiwari645@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "1585181152715220",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2437421483386272",
      "name": "Chandan Sen",
      "phone_number": "9474137085",
      "email": "chandansen1122@gmail.com",
      "preferred_city": "Haringhata.Nadia. W.B",
      "source": "FaceBook",
      "form_name": "2437421483386272",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR01",
      "utm_campaign_id": "120239397742420018",
      "student_comment": [
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "marketing"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919474137085"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25083406557999286?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1508728287345618",
      "name": "Shivam",
      "phone_number": "9669694969",
      "email": "shivam.sharma10021@gmail.com",
      "preferred_city": "Madhya Pradesh",
      "source": "FaceBook",
      "form_name": "1508728287345618",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1885761965403518",
      "name": "Sonu",
      "phone_number": "8585973588",
      "email": "Sonumj17@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "1885761965403518",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "2201862747294399",
      "name": "faithfully",
      "phone_number": "8131831690",
      "email": "gracefully@gmail.com",
      "preferred_city": "Shillong",
      "source": "FaceBook",
      "form_name": "2201862747294399",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918131831690"
        }
      ]
    },
    {
      "lead_id": "1633109857721849",
      "name": "Abhishek",
      "phone_number": "8090373129",
      "email": "yadavabhishek4367@gmail.com",
      "preferred_city": "Tulsipur, Balrampur",
      "source": "FaceBook",
      "form_name": "1633109857721849",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR03",
      "utm_campaign_id": "120239398604260018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "just_exploring"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "business_analytics"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "8090373129"
        }
      ]
    },
    {
      "lead_id": "4385993841721756",
      "name": "Aditya Malviya",
      "phone_number": "9807753551",
      "email": "adityaupadhyay98077@gmail.com",
      "preferred_city": "Deoria Gorakhpur",
      "source": "FaceBook",
      "form_name": "4385993841721756",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "821950610277892",
      "name": "Amrit",
      "phone_number": "7878561434",
      "email": "amartlalmeena1@gmail.com",
      "preferred_city": "Udaipur , Rajasthan",
      "source": "FaceBook",
      "form_name": "821950610277892",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917878561434"
        }
      ]
    },
    {
      "lead_id": "2772123846481458",
      "name": "Umesh Behera",
      "phone_number": "9853215537",
      "email": "bmohapatra58@gmail.com",
      "preferred_city": "jajpur",
      "source": "FaceBook",
      "form_name": "2772123846481458",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919853215537"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26153424757653811?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "973872131876250",
      "name": "Nikesh Lodhi",
      "phone_number": "8954470220",
      "email": "knikesh2024@gmail.com",
      "preferred_city": "Dibai",
      "source": "FaceBook",
      "form_name": "973872131876250",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_m.com"
        }
      ]
    },
    {
      "lead_id": "4516938395217442",
      "name": "Sultana Borbhuiya",
      "phone_number": "9957778662",
      "email": "sultana285@gmail.com",
      "preferred_city": "Silchar, (udharbond)",
      "source": "FaceBook",
      "form_name": "4516938395217442",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919957778662"
        }
      ]
    },
    {
      "lead_id": "3517542385070154",
      "name": "Mohit RaThoRE",
      "phone_number": "9910012455",
      "email": "ramsagarrathore9315@gmail.com",
      "preferred_city": "Ghaziabad",
      "source": "FaceBook",
      "form_name": "3517542385070154",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "2195599027922617",
      "name": "Gaurav Kumar",
      "phone_number": "9783465174",
      "email": "gg3348178@gmail.com",
      "preferred_city": "Tijara",
      "source": "FaceBook",
      "form_name": "2195599027922617",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR03",
      "utm_campaign_id": "120239398604260018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "graduation_completed"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "operations_&_supply_chain"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919783465174"
        }
      ]
    },
    {
      "lead_id": "929112359503067",
      "name": "Nonidhi Tanwar",
      "phone_number": "9311035202",
      "email": "nonidhit@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "929112359503067",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919311035202"
        }
      ]
    },
    {
      "lead_id": "1438418240550454",
      "name": "Sachin Santoshi",
      "phone_number": "9459002754",
      "email": "santoshisachin12@gmail.com",
      "preferred_city": "Kangra",
      "source": "FaceBook",
      "form_name": "1438418240550454",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919459002754"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26091616000529850?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "26284263547905660",
      "name": "SIDDHESHWAR TATHE",
      "phone_number": "9529079877",
      "email": "sidtathe7@gmail.com",
      "preferred_city": "Chhatrapati sambhaji nagar",
      "source": "FaceBook",
      "form_name": "26284263547905660",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919529079877"
        }
      ]
    },
    {
      "lead_id": "2264115817452303",
      "name": "Onidaris Marwein",
      "phone_number": "9233266970",
      "email": "marweinonidaris@gmail.com",
      "preferred_city": "Shillong",
      "source": "FaceBook",
      "form_name": "2264115817452303",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919233266970"
        }
      ]
    },
    {
      "lead_id": "913184414848333",
      "name": "Fraud log hai, leads mat lena",
      "phone_number": "+9184213155555",
      "email": "deepsolanki@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "913184414848333",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR03",
      "utm_campaign_id": "120239398604260018",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+9184213155555"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "hr"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "928986393280186",
      "name": "shahu vijay",
      "phone_number": "8469261077",
      "email": "vk1359160@gmail.com",
      "preferred_city": "Surat",
      "source": "FaceBook",
      "form_name": "928986393280186",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "702434746293728",
      "name": "shweta",
      "phone_number": "9910438650",
      "email": "sweta90904@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "702434746293728",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919910438650"
        }
      ]
    },
    {
      "lead_id": "976785448115501",
      "name": "Rahul Solanki",
      "phone_number": "8279332557",
      "email": "rahulsolanki18073@gmail.com",
      "preferred_city": "Bulandshahr",
      "source": "FaceBook",
      "form_name": "976785448115501",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26340783342227018?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "917899951244645",
      "name": "Amit Sangma",
      "phone_number": "6901456811",
      "email": "amritsangmach@gmail.com",
      "preferred_city": "Gauhati",
      "source": "FaceBook",
      "form_name": "917899951244645",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916901456811"
        }
      ]
    },
    {
      "lead_id": "26336698196020584",
      "name": "Hemanta Das",
      "phone_number": "8822078764",
      "email": "hdas23296@gmail.com",
      "preferred_city": "Udalguri",
      "source": "FaceBook",
      "form_name": "26336698196020584",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918822078764"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26182849798044488?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1295216165855035",
      "name": "~Sasanka Kalita~",
      "phone_number": "7399423235",
      "email": "sasankakalitask@gmail.com",
      "preferred_city": "Chhaygaon",
      "source": "FaceBook",
      "form_name": "1295216165855035",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "7399423235"
        }
      ]
    },
    {
      "lead_id": "960230736687403",
      "name": "Shilpi Kumari",
      "phone_number": "7366896218",
      "email": "shilpikumari641@gmail.com",
      "preferred_city": "Patna",
      "source": "FaceBook",
      "form_name": "960230736687403",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917366896218"
        }
      ]
    },
    {
      "lead_id": "1338671164738192",
      "name": "Sonu Kumar",
      "phone_number": "9310524577",
      "email": "sonukumarbansal120@gmail.com",
      "preferred_city": "faridabad",
      "source": "FaceBook",
      "form_name": "1338671164738192",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919310524577"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26231482896512394?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "929616133116713",
      "name": "AA Global",
      "phone_number": "7091091229",
      "email": "mahinderg11@gmail.com",
      "preferred_city": "Indore",
      "source": "FaceBook",
      "form_name": "929616133116713",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917091091229"
        }
      ]
    },
    {
      "lead_id": "1226737842978302",
      "name": "Rajat",
      "phone_number": "9871267545",
      "email": "rajatkumar45190@gmail.com",
      "preferred_city": "Uttar Pradesh",
      "source": "FaceBook",
      "form_name": "1226737842978302",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "964699142914338",
      "name": "𝐍𝐈𝐓𝐈𝐍 𝐆𝐔𝐏𝐓𝐀",
      "phone_number": "6207639352",
      "email": "dinesh7488651854@gmail.com",
      "preferred_city": "Bagaha",
      "source": "FaceBook",
      "form_name": "964699142914338",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1822837231742094",
      "name": "Ram Barman",
      "phone_number": "8317311316",
      "email": "rambarman1608@gmail.com",
      "preferred_city": "Raiganj",
      "source": "FaceBook",
      "form_name": "1822837231742094",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918317311316"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/34520889480859410?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "4356756101275673",
      "name": "Raj Kumar Singh",
      "phone_number": "6003257747",
      "email": "gsr885452@gmail.com",
      "preferred_city": "Golaghat",
      "source": "FaceBook",
      "form_name": "4356756101275673",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916003257747"
        }
      ]
    },
    {
      "lead_id": "935157989290068",
      "name": "Aniket Malik",
      "phone_number": "8802015503",
      "email": "aniketmalik1996@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "935157989290068",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1581678176239408",
      "name": "Dipali jaiswal",
      "phone_number": "6291958628",
      "email": "sanujaiswal682@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1581678176239408",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "6291958628"
        }
      ]
    },
    {
      "lead_id": "2841992882810557",
      "name": "Sumathi venkatesh",
      "phone_number": "9844341965",
      "email": "sumathimurthy06@gmail.com",
      "preferred_city": "Bangalore",
      "source": "FaceBook",
      "form_name": "2841992882810557",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919844341965"
        }
      ]
    },
    {
      "lead_id": "1480742833453552",
      "name": "Surinder Singh",
      "phone_number": "8904955211",
      "email": "surinder739@gmail.com",
      "preferred_city": "Gurugram",
      "source": "FaceBook",
      "form_name": "1480742833453552",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918904955211"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26577534978537022?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1318171926882419",
      "name": "Prashant",
      "phone_number": "8447610308",
      "email": "vickykg4@gmail.com",
      "preferred_city": "Ghaziabad",
      "source": "FaceBook",
      "form_name": "1318171926882419",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26161621870146895?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1266218955059751",
      "name": "Shivam Raaj",
      "phone_number": "9170710965",
      "email": "8417018946sky@gmail.com",
      "preferred_city": "Ballia",
      "source": "FaceBook",
      "form_name": "1266218955059751",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "9170710965"
        }
      ]
    },
    {
      "lead_id": "820883613754598",
      "name": "tracymarak",
      "phone_number": "7099787376",
      "email": "tracymarak234@gmail.com",
      "preferred_city": "Assam",
      "source": "FaceBook",
      "form_name": "820883613754598",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917099787376"
        }
      ]
    },
    {
      "lead_id": "926230736708238",
      "name": "Shahil kumar",
      "phone_number": "9576500775",
      "email": "shahilkmr235@gmail.com",
      "preferred_city": "Patna",
      "source": "FaceBook",
      "form_name": "926230736708238",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919576500775"
        }
      ]
    },
    {
      "lead_id": "1515757216787117",
      "name": "Shraddha Goswami",
      "phone_number": "9375783140",
      "email": "shraddhabinoygoswami@gmail.com",
      "preferred_city": "Daman",
      "source": "FaceBook",
      "form_name": "1515757216787117",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919375783140"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26408546342131692?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1267058915535980",
      "name": "Tushar Patel",
      "phone_number": "9151701144",
      "email": "by6916194@gmail.com",
      "preferred_city": "Raebareli",
      "source": "FaceBook",
      "form_name": "1267058915535980",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "1197316422477919",
      "name": "alon ladka",
      "phone_number": "9793412258",
      "email": "dk886745@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "1197316422477919",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "1607738283793465",
      "name": "Adil R Sandh",
      "phone_number": "8511535346",
      "email": "adilsandh64@gmail.com",
      "preferred_city": "Mundra",
      "source": "FaceBook",
      "form_name": "1607738283793465",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918511535346"
        }
      ]
    },
    {
      "lead_id": "2083181285586724",
      "name": "rajni  Goyal",
      "phone_number": "9990051966",
      "email": "jitender.goyal21@gmail.com",
      "preferred_city": "delhi",
      "source": "FaceBook",
      "form_name": "2083181285586724",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919990051966"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26845082901795973?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1567084131047954",
      "name": "Chiranjit chakma",
      "phone_number": "8837054523",
      "email": "Chiranjitchakma76@gmail.com",
      "preferred_city": "Pecharthal",
      "source": "FaceBook",
      "form_name": "1567084131047954",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+918837054523"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26323584053927509?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "904725452458730",
      "name": "Aasif Raja",
      "phone_number": "8803790527",
      "email": "prince.ar.34@gmail.com",
      "preferred_city": "Srinagar",
      "source": "FaceBook",
      "form_name": "904725452458730",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918803790527"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27265549163034597?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "983937354298349",
      "name": "Arunpriya Sabat",
      "phone_number": "9439761094",
      "email": "sabat149@gmail.com",
      "preferred_city": "Rayagada",
      "source": "FaceBook",
      "form_name": "983937354298349",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919439761094"
        }
      ]
    },
    {
      "lead_id": "1456553386110773",
      "name": "Pooja goyat",
      "phone_number": "8950521961",
      "email": "poojadeepak4282@gmail.com",
      "preferred_city": "Kaithal",
      "source": "FaceBook",
      "form_name": "1456553386110773",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918950521961"
        }
      ]
    },
    {
      "lead_id": "1414737793301341",
      "name": "Rahul yadav",
      "phone_number": "9105502824",
      "email": "harshofficial1726@gmail.com",
      "preferred_city": "Agra",
      "source": "FaceBook",
      "form_name": "1414737793301341",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "2010130983234782",
      "name": "Meenu Ji",
      "phone_number": "8130496775",
      "email": "meenujatav23@gmail.com",
      "preferred_city": "Tyyy",
      "source": "FaceBook",
      "form_name": "2010130983234782",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "1376869650876154",
      "name": "Ruanga Renthlei",
      "phone_number": "8730835375",
      "email": "apekipa@gmail.com",
      "preferred_city": "Champhai",
      "source": "FaceBook",
      "form_name": "1376869650876154",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918730835375"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25937557779259597?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1304485264936826",
      "name": "KRISHNA__..",
      "phone_number": "+7900556710",
      "email": "ks6231404@gmail.com",
      "preferred_city": "Meerut",
      "source": "FaceBook",
      "form_name": "1304485264936826",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+7900556710"
        }
      ]
    },
    {
      "lead_id": "972704205180952",
      "name": "Mohana Kutty",
      "phone_number": "9080071665",
      "email": "rajardren@gmail.com",
      "preferred_city": "Chennai",
      "source": "FaceBook",
      "form_name": "972704205180952",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919080071665"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26592506303678283?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1438516104424033",
      "name": "Virendra",
      "phone_number": "8383810721",
      "email": "vsquare303602@gmail.com",
      "preferred_city": "Jaipur",
      "source": "FaceBook",
      "form_name": "1438516104424033",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "8383810721"
        }
      ]
    },
    {
      "lead_id": "3976229542507591",
      "name": "Shriya TG",
      "phone_number": "7085168655",
      "email": "st2148658@gmail.com",
      "preferred_city": "Tinsukia",
      "source": "FaceBook",
      "form_name": "3976229542507591",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+917085168655"
        }
      ]
    },
    {
      "lead_id": "26551722014516082",
      "name": "Ritu",
      "phone_number": "8354877910",
      "email": "ritus.mcom@gmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "26551722014516082",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918354877910"
        }
      ]
    },
    {
      "lead_id": "2412895789216190",
      "name": "Katara Ankit",
      "phone_number": "9925248250",
      "email": "ankitkatara77@gmail.com",
      "preferred_city": "Anand",
      "source": "FaceBook",
      "form_name": "2412895789216190",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "9925248250"
        }
      ]
    },
    {
      "lead_id": "888108490950373",
      "name": "Asheesh Barwan",
      "phone_number": "8057827083",
      "email": "asheesh.8057827083@gmail.com",
      "preferred_city": "Purola",
      "source": "FaceBook",
      "form_name": "888108490950373",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.sc"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918057827083"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/35765407033058870?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "3460596484092783",
      "name": "Anita Chetry",
      "phone_number": "9387506397",
      "email": "anitachetry260@gmail.com",
      "preferred_city": "Tezpur",
      "source": "FaceBook",
      "form_name": "3460596484092783",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919387506397"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26457035203982675?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2101721523949552",
      "name": "R Benjamino Indwar",
      "phone_number": "8011310090",
      "email": "rosbensdb@rediffmail.com",
      "preferred_city": "Gauhati",
      "source": "FaceBook",
      "form_name": "2101721523949552",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+918011310090"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "946751311185148",
      "name": "Shivam jaat",
      "phone_number": "7703874005",
      "email": "sc652383@gmail.com",
      "preferred_city": "Agra",
      "source": "FaceBook",
      "form_name": "946751311185148",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+917703874005"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1325083079443870",
      "name": "Rana Deen Dayal",
      "phone_number": "9911353377",
      "email": "dayaloffset@gmail.com",
      "preferred_city": "delhi",
      "source": "FaceBook",
      "form_name": "1325083079443870",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919911353377"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26448997534735763?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1248191534113085",
      "name": "Ridhima Singh",
      "phone_number": "8171946076",
      "email": "redhimasingh590@gmail.com",
      "preferred_city": "Bareilly",
      "source": "FaceBook",
      "form_name": "1248191534113085",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1780178000066305",
      "name": "Shadab Khan",
      "phone_number": "9022487283",
      "email": "shadab.khan0405@gmail.com",
      "preferred_city": "Mumbai",
      "source": "FaceBook",
      "form_name": "1780178000066305",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919022487283"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25702903489388023?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1242162884289162",
      "name": "Jaya Chakravorty",
      "phone_number": "8989649646",
      "email": "jayachak70@gmail.com",
      "preferred_city": "bhopal",
      "source": "FaceBook",
      "form_name": "1242162884289162",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918989649646"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26531189853235027?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2905975219794278",
      "name": "Rupali",
      "phone_number": "6287354043",
      "email": "rupalijha204@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "2905975219794278",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+916287354043"
        }
      ]
    },
    {
      "lead_id": "1240593474857219",
      "name": "𝑺𝒖𝒔𝒉𝒊𝒍",
      "phone_number": "9696041803",
      "email": "sushilkumar99423@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "1240593474857219",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1661718738595557",
      "name": "Aditi Jaiswal",
      "phone_number": "9935411962",
      "email": "jaiswalanand@gmail.com",
      "preferred_city": "Gorkhpur",
      "source": "FaceBook",
      "form_name": "1661718738595557",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "phone",
          "answer": "+919935411962"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        }
      ]
    },
    {
      "lead_id": "1737800287188989",
      "name": "Brijesh Kumar Prajapati",
      "phone_number": "8625067534",
      "email": "brijesh.nagod@gmail.com",
      "preferred_city": "satna",
      "source": "FaceBook",
      "form_name": "1737800287188989",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.sc"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918625067534"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25866453443051405?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "34563148396633295",
      "name": "R I Y A  S H A R M A",
      "phone_number": "6239152600",
      "email": "rs0828938@gmail.com",
      "preferred_city": "Jalandhar",
      "source": "FaceBook",
      "form_name": "34563148396633295",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916239152600"
        }
      ]
    },
    {
      "lead_id": "1428021201897026",
      "name": "Rahwaj",
      "phone_number": "89044 03067",
      "email": "Builddd.io@gmail.com",
      "preferred_city": "Kasaragod",
      "source": "FaceBook",
      "form_name": "1428021201897026",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR06",
      "utm_campaign_id": "120239445099840018",
      "student_comment": [
        {
          "question": "phone",
          "answer": "89044 03067"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "just_exploring"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "marketing"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        }
      ]
    },
    {
      "lead_id": "879363861814553",
      "name": "Akhilesh yadav",
      "phone_number": "9120795167",
      "email": "abhyasyadav372@gmail.com",
      "preferred_city": "Kushinagar",
      "source": "FaceBook",
      "form_name": "879363861814553",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad02",
      "utm_campaign_id": "120240855626530240",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "phone",
          "answer": "+919120795167"
        }
      ]
    },
    {
      "lead_id": "1643538559999173",
      "name": "Anshika Gupta",
      "phone_number": "8433409765",
      "email": "ag6771571@gmail.com",
      "preferred_city": "Saharanpur",
      "source": "FaceBook",
      "form_name": "1643538559999173",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "1275800761409836",
      "name": "Sadia Azmat",
      "phone_number": "6291616604",
      "email": "vdsidlover@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1275800761409836",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.sc"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916291616604"
        }
      ]
    },
    {
      "lead_id": "825520319885830",
      "name": "Biswajit Sa",
      "phone_number": "8658453724",
      "email": "sabiswa4@gmail.com",
      "preferred_city": "Jharsuguda",
      "source": "FaceBook",
      "form_name": "825520319885830",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918658453724"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26259874173622415?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "960888962944147",
      "name": "𝐏𝐫𝐚𝐝𝐞𝐞𝐩 𝐊𝐮𝐦𝐚𝐫 𝐒𝐨𝐧𝐢..",
      "phone_number": "7054290441",
      "email": "pradeep705429@gmail.com",
      "preferred_city": "Allahabad",
      "source": "FaceBook",
      "form_name": "960888962944147",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "2219935218752735",
      "name": "shubham kumar",
      "phone_number": "+18002375691",
      "email": "sonelalsah93558@gmail.com",
      "preferred_city": "Sheohar",
      "source": "FaceBook",
      "form_name": "2219935218752735",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+18002375691"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/24804219022589425?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1926605094627049",
      "name": "Vasugi Arumugaraj",
      "phone_number": "9629569544",
      "email": "a.vasugi187@gmail.com",
      "preferred_city": "Bangalore",
      "source": "FaceBook",
      "form_name": "1926605094627049",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919629569544"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26671838075745137?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1218874187069375",
      "name": "AP",
      "phone_number": "8250548819",
      "email": "dguuhu222@yahoo.in",
      "preferred_city": "rabong",
      "source": "FaceBook",
      "form_name": "1218874187069375",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918250548819"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26522032877393555?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "994015963288020",
      "name": "Vikas Sharma",
      "phone_number": "7570078781",
      "email": "vs269317@gmail.com",
      "preferred_city": "Hardoi",
      "source": "FaceBook",
      "form_name": "994015963288020",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917570078781"
        }
      ]
    },
    {
      "lead_id": "1642878860465895",
      "name": "Baljit kaur",
      "phone_number": "6284487158",
      "email": "beetpanesar1158@gmail.com",
      "preferred_city": "Ludhiana",
      "source": "FaceBook",
      "form_name": "1642878860465895",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "6284487158"
        }
      ]
    },
    {
      "lead_id": "2396407580861217",
      "name": "𝓢𝓾𝓱𝓾𝓬𝓱𝓸𝓹𝓻𝓪",
      "phone_number": "9310267722",
      "email": "suhanimehta476@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "2396407580861217",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919310267722"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "796746009716335",
      "name": "Alpha PS",
      "phone_number": "8837721647",
      "email": "puneet12june1989@gmail.com",
      "preferred_city": "Chandigarh",
      "source": "FaceBook",
      "form_name": "796746009716335",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918837721647"
        }
      ]
    },
    {
      "lead_id": "832734579858889",
      "name": "Rabindra Paul",
      "phone_number": "9002863790",
      "email": "rabin.paul1978@gmail.com",
      "preferred_city": "Alipurduar",
      "source": "FaceBook",
      "form_name": "832734579858889",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919002863790"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26249202724728652?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1706785744088329",
      "name": "Shreya singh",
      "phone_number": "9696925489",
      "email": "shreyaadisingh@gmail.com",
      "preferred_city": "Gorakhpur",
      "source": "FaceBook",
      "form_name": "1706785744088329",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad02",
      "utm_campaign_id": "120240869439580240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919696925489"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "applied_sciences"
        }
      ]
    },
    {
      "lead_id": "923117207241119",
      "name": "kajal singh shrinet",
      "phone_number": "8470878220",
      "email": "kajalsingh847086@gmail.com",
      "preferred_city": "Siddharthanagar",
      "source": "FaceBook",
      "form_name": "923117207241119",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "3283080345188718",
      "name": "sohil fathiml",
      "phone_number": "8082434001",
      "email": "shahidaparveen@gmail.com",
      "preferred_city": "Jammu and kashmir",
      "source": "FaceBook",
      "form_name": "3283080345188718",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918082434001"
        }
      ]
    },
    {
      "lead_id": "1459079175856053",
      "name": "Aquib",
      "phone_number": "7455881198",
      "email": "ahilaquib@gmail.com",
      "preferred_city": "Aligarh",
      "source": "FaceBook",
      "form_name": "1459079175856053",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917455881198"
        }
      ]
    },
    {
      "lead_id": "4665920756984675",
      "name": "Prashant Sharma",
      "phone_number": "9058775468",
      "email": "prashantsharma8396@gmail.com",
      "preferred_city": "Shamli",
      "source": "FaceBook",
      "form_name": "4665920756984675",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1135664915331972",
      "name": "Zeeshan Amin",
      "phone_number": "9541498621",
      "email": "mohdaminbutt@gmail.com",
      "preferred_city": "Pulwama (Kashmir)",
      "source": "FaceBook",
      "form_name": "1135664915331972",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919541498621"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26846961468235169?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "907362445261300",
      "name": "Harshit Tyagi",
      "phone_number": "6398801753",
      "email": "tharshit346@gmail.com",
      "preferred_city": "Muzaffarnagar",
      "source": "FaceBook",
      "form_name": "907362445261300",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "920297080887859",
      "name": "feoud",
      "phone_number": "7042264853",
      "email": "Nikshitraghuvanshi@gmail.com",
      "preferred_city": "Shahpur",
      "source": "FaceBook",
      "form_name": "920297080887859",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1559517912404097",
      "name": "Rajendra Kumar Safi",
      "phone_number": "8084561256",
      "email": "rajendrakumarsafi@gmail.com",
      "preferred_city": "new Delhi",
      "source": "FaceBook",
      "form_name": "1559517912404097",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918084561256"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26192903183703490?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "4261251814188352",
      "name": "मनु त्यागी",
      "phone_number": "9068729633",
      "email": "tmanu8245@gamil.com",
      "preferred_city": "Machhra",
      "source": "FaceBook",
      "form_name": "4261251814188352",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919068729633"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1631980944700267",
      "name": "Amber Vishnoi",
      "phone_number": "9897309295",
      "email": "ambervishnoi23@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "1631980944700267",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1501339458086048",
      "name": "Anoop Maurya",
      "phone_number": "7379547155",
      "email": "anoopmaurya0625@gmail.com",
      "preferred_city": "Licknow",
      "source": "FaceBook",
      "form_name": "1501339458086048",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1474115277763070",
      "name": "Pawan singh",
      "phone_number": "7220000887",
      "email": "vivaanrathore1623@gmail.com",
      "preferred_city": "Jhunjhunu",
      "source": "FaceBook",
      "form_name": "1474115277763070",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "1398320422065452",
      "name": "Jakariya Ahmed",
      "phone_number": "6901178203",
      "email": "jakariyaahmed398@gmail.com",
      "preferred_city": "Chennai",
      "source": "FaceBook",
      "form_name": "1398320422065452",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916901178203"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27240413778972518?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2332786617243599",
      "name": "venkatkasinath",
      "phone_number": "8074629571",
      "email": "kvknath27@gmail.com",
      "preferred_city": "Hyderabad",
      "source": "FaceBook",
      "form_name": "2332786617243599",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918074629571"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26619971550989894?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "3741325549342634",
      "name": "Pragnya Paramita barik",
      "phone_number": "6370738763",
      "email": "herepragnya@gmail.com",
      "preferred_city": "Jajpur Orissa",
      "source": "FaceBook",
      "form_name": "3741325549342634",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916370738763"
        }
      ]
    },
    {
      "lead_id": "2024996088047487",
      "name": "Alok Biswas",
      "phone_number": "7500061666",
      "email": "alokbiswas9917@gmail.com",
      "preferred_city": "Udham Singh nagar",
      "source": "FaceBook",
      "form_name": "2024996088047487",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1305222641529062",
      "name": "Atharv shukla",
      "phone_number": "9935381808",
      "email": "anils171977@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "1305222641529062",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad02",
      "utm_campaign_id": "120240869439580240",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "phone",
          "answer": "9935381808"
        }
      ]
    },
    {
      "lead_id": "952859953951263",
      "name": "Samsun Nesha",
      "phone_number": "9348092026",
      "email": "samsunnesha76@gmail.com",
      "preferred_city": "Bhubaneswar",
      "source": "FaceBook",
      "form_name": "952859953951263",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919348092026"
        }
      ]
    },
    {
      "lead_id": "1657762578562333",
      "name": "Dushyant Gaur",
      "phone_number": "9258958083",
      "email": "deepakgaurdeepakgaur17@gmail.com",
      "preferred_city": "Karora",
      "source": "FaceBook",
      "form_name": "1657762578562333",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1719610162362458",
      "name": "Gujuri Bichitra Pradhan",
      "phone_number": "6370147597",
      "email": "gbichitra123@outlook.com",
      "preferred_city": "Bengaluru",
      "source": "FaceBook",
      "form_name": "1719610162362458",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+916370147597"
        }
      ]
    },
    {
      "lead_id": "1243923844616655",
      "name": "PINKI SAHOO",
      "phone_number": "9547194827",
      "email": "bapanbpmp@gmail.com",
      "preferred_city": "PURBA MEDINIPUR",
      "source": "FaceBook",
      "form_name": "1243923844616655",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919547194827"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27429462863310046?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1473417554315456",
      "name": "₳₭₴Ⱨ₳Ɽ₳",
      "phone_number": "6388844858",
      "email": "agrahariak2005@gmail.com",
      "preferred_city": "Varanasi",
      "source": "FaceBook",
      "form_name": "1473417554315456",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916388844858"
        }
      ]
    },
    {
      "lead_id": "965424819379237",
      "name": "Laxman Choudhary",
      "phone_number": "7909064980",
      "email": "laxmanclax@gmail.com",
      "preferred_city": "ara, koilwar",
      "source": "FaceBook",
      "form_name": "965424819379237",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "7909064980"
        }
      ]
    },
    {
      "lead_id": "1215374750412036",
      "name": "Deep Jyoti Das",
      "phone_number": "9577873483",
      "email": "102deepjyoti@gmail.com",
      "preferred_city": "Bokakhat",
      "source": "FaceBook",
      "form_name": "1215374750412036",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919577873483"
        }
      ]
    },
    {
      "lead_id": "4155035691424497",
      "name": "Vaibhav Jain",
      "phone_number": "6377137304",
      "email": "gj5868496@gmail.com",
      "preferred_city": "Mumbai",
      "source": "FaceBook",
      "form_name": "4155035691424497",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "929623899905764",
      "name": "Shambhu Sangam",
      "phone_number": "7654753597",
      "email": "shambhugupta0699@gmail.com",
      "preferred_city": "Sheohar",
      "source": "FaceBook",
      "form_name": "929623899905764",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917654753597"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25561888713489345?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "4315479665373163",
      "name": "kajal yadav",
      "phone_number": "8090782036",
      "email": "kumaryadav1041997@gmai.com",
      "preferred_city": "Chaundauli",
      "source": "FaceBook",
      "form_name": "4315479665373163",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad02",
      "utm_campaign_id": "120240855626530240",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "phone",
          "answer": "8090782036"
        }
      ]
    },
    {
      "lead_id": "936251612459497",
      "name": "Pavitra kumar",
      "phone_number": "7307264049",
      "email": "kumrpavi@gmail.com",
      "preferred_city": "Hargaon",
      "source": "FaceBook",
      "form_name": "936251612459497",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "2221956098543686",
      "name": "Lakhe",
      "phone_number": "8986684753",
      "email": "lakha3159@outlook.com",
      "preferred_city": "Bokaro Steel City",
      "source": "FaceBook",
      "form_name": "2221956098543686",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918986684753"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26076421445333581?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2379184295911027",
      "name": "Vaibhav Gupta",
      "phone_number": "9068935873",
      "email": "vaibhavgupta199555@gmail.com",
      "preferred_city": "Agra",
      "source": "FaceBook",
      "form_name": "2379184295911027",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1444736550451229",
      "name": "Ajay Yadav",
      "phone_number": "7521845099",
      "email": "ajayyadav752184@gmail.com",
      "preferred_city": "Sounli",
      "source": "FaceBook",
      "form_name": "1444736550451229",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "pharmacy"
        },
        {
          "question": "phone",
          "answer": "+917521845099"
        }
      ]
    },
    {
      "lead_id": "1459631655631562",
      "name": "Vanshu",
      "phone_number": "6005621359",
      "email": "vanshuvansun@gmail.com",
      "preferred_city": "Jammu",
      "source": "FaceBook",
      "form_name": "1459631655631562",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+916005621359"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "938755818865491",
      "name": "Yash raj",
      "phone_number": "9955222380",
      "email": "sanjeevsingh77701@gmail.com",
      "preferred_city": "Patna",
      "source": "FaceBook",
      "form_name": "938755818865491",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "2655208948194860",
      "name": "Rajesh Singh Tandela",
      "phone_number": "9431279702",
      "email": "rajeshanand504@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "2655208948194860",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "831329405918244",
      "name": "Kamlesh Kumar",
      "phone_number": "8219756647",
      "email": "kamalhimvacationtravel@gmail.com",
      "preferred_city": "solan",
      "source": "FaceBook",
      "form_name": "831329405918244",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918219756647"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27997750433226019?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1726684108308839",
      "name": "Manju",
      "phone_number": "8139929002",
      "email": "manjudhakshith@gmail.com",
      "preferred_city": "shimoga",
      "source": "FaceBook",
      "form_name": "1726684108308839",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918139929002"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27404764629111730?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "3469848089858482",
      "name": "Prakash Meghval",
      "phone_number": "9723801348",
      "email": "prakashmeghval26@gmail.com",
      "preferred_city": "Gandhinagar Gujarat",
      "source": "FaceBook",
      "form_name": "3469848089858482",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919723801348"
        }
      ]
    },
    {
      "lead_id": "2407690526309275",
      "name": "Gulam Ahmad Raza",
      "phone_number": "6290763434",
      "email": "serajg550@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "2407690526309275",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916290763434"
        }
      ]
    },
    {
      "lead_id": "1262923939315794",
      "name": "Pawan Kumar",
      "phone_number": "9888754861",
      "email": "soniaranibc@gmail.com",
      "preferred_city": "mohali",
      "source": "FaceBook",
      "form_name": "1262923939315794",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919888754861"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27007536432205501?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1454584186214081",
      "name": "Chandrakant Rathod",
      "phone_number": "7405247382",
      "email": "chandresh.krisha@gmail.com",
      "preferred_city": "Ahmedabad",
      "source": "FaceBook",
      "form_name": "1454584186214081",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917405247382"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26343250735301445?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1937108956941646",
      "name": "Ramya Ramya",
      "phone_number": "9566109863",
      "email": "ramyaram956610@gmail.com",
      "preferred_city": "Shoolagiri",
      "source": "FaceBook",
      "form_name": "1937108956941646",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919566109863"
        }
      ]
    },
    {
      "lead_id": "2499868503800494",
      "name": "Sashank thakur",
      "phone_number": "7455981431",
      "email": "kumarsinghanuj399@gmail.com",
      "preferred_city": "Aligarh",
      "source": "FaceBook",
      "form_name": "2499868503800494",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "2338332716662990",
      "name": "Saksham Negi.",
      "phone_number": "7042425270",
      "email": "sakshamnegi10092006@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "2338332716662990",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "3857300214564538",
      "name": "Saniya kumari",
      "phone_number": "7050285975",
      "email": "chocoonly201@gmail.com",
      "preferred_city": "Ranchi",
      "source": "FaceBook",
      "form_name": "3857300214564538",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "7050285975"
        }
      ]
    },
    {
      "lead_id": "1458017082367808",
      "name": "Saloni tomar",
      "phone_number": "8962344198",
      "email": "salonitomar309@gmail.com",
      "preferred_city": "gwalior",
      "source": "FaceBook",
      "form_name": "1458017082367808",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1068387396356740",
      "name": "Upmanyu Pratap Singh",
      "phone_number": "8299715961",
      "email": "singhupmanyu460@gmail.com",
      "preferred_city": "Greater Noida",
      "source": "FaceBook",
      "form_name": "1068387396356740",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "1866023327450017",
      "name": "Asha Kachhap",
      "phone_number": "8252615789",
      "email": "alaxbantikachhap12@gmail.com",
      "preferred_city": "Ranchi",
      "source": "FaceBook",
      "form_name": "1866023327450017",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918252615789"
        }
      ]
    },
    {
      "lead_id": "726382153798580",
      "name": "Aditya sky",
      "phone_number": "9279021474",
      "email": "sharmaaditya95820@gmail.com",
      "preferred_city": "Mopati",
      "source": "FaceBook",
      "form_name": "726382153798580",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "9279021474"
        }
      ]
    },
    {
      "lead_id": "1287671609938558",
      "name": "RAJPUT",
      "phone_number": "8273589556",
      "email": "mohdfaizsolanki@gmail.com",
      "preferred_city": "Aligarh",
      "source": "FaceBook",
      "form_name": "1287671609938558",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "932152109557497",
      "name": "Mahar Ali Sikdar",
      "phone_number": "9401220150",
      "email": "maharsikdar53@gmail.com",
      "preferred_city": "barpeta, ganakpara(reserve)",
      "source": "FaceBook",
      "form_name": "932152109557497",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919401220150"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26730461543250107?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "919894680654758",
      "name": "Farook Mohammed",
      "phone_number": "9314620078",
      "email": "mfarook.farook@gmail.com",
      "preferred_city": "Jaipur",
      "source": "FaceBook",
      "form_name": "919894680654758",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919314620078"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26273971152289246?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1265934888297313",
      "name": "Pradip Mandal",
      "phone_number": "9546580153",
      "email": "hdjdhjdjf777@gmail.com",
      "preferred_city": "Hazaribag",
      "source": "FaceBook",
      "form_name": "1265934888297313",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1493008595725552",
      "name": "Abhishek Jain",
      "phone_number": "9979582629",
      "email": "Jabhishek560@rediff.com",
      "preferred_city": "Surat",
      "source": "FaceBook",
      "form_name": "1493008595725552",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Guide",
      "utm_campaign": "Online_MBA_Guide_int_Ad_CR03",
      "utm_campaign_id": "120239398604260018",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919979582629"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "hr"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        }
      ]
    },
    {
      "lead_id": "3483426561798399",
      "name": "Jagdish Singh",
      "phone_number": "7425877557",
      "email": "jagdish74557@gmail.com",
      "preferred_city": "haldwani",
      "source": "FaceBook",
      "form_name": "3483426561798399",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917425877557"
        }
      ]
    },
    {
      "lead_id": "1597934924842440",
      "name": "Ankit Anand",
      "phone_number": "9661522629",
      "email": "ankitanand233223@gmail.com",
      "preferred_city": "Sahibganj",
      "source": "FaceBook",
      "form_name": "1597934924842440",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919661522629"
        }
      ]
    },
    {
      "lead_id": "1295705715778027",
      "name": "Tamajit Nath",
      "phone_number": "8777872243",
      "email": "tamajitnath91@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1295705715778027",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918777872243"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26033033802985654?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2145188959572921",
      "name": "RAJENDRAKUMARYADAV",
      "phone_number": "7665226622",
      "email": "rajendrakumaryadav57983@gmail.com",
      "preferred_city": "JAIPUR",
      "source": "FaceBook",
      "form_name": "2145188959572921",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+917665226622"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26402822942715094?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1426902108603850",
      "name": "Vishesh Silelan",
      "phone_number": "8448572315",
      "email": "v23107239@gmail.com",
      "preferred_city": "Sec 115 noida  ankur farm house",
      "source": "FaceBook",
      "form_name": "1426902108603850",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918448572315"
        }
      ]
    },
    {
      "lead_id": "1448368559992774",
      "name": "Devansh srivastava",
      "phone_number": "6392891551",
      "email": "devanshsrivastava2627@gmail.com",
      "preferred_city": "Lakhimpur",
      "source": "FaceBook",
      "form_name": "1448368559992774",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "2084223882434606",
      "name": "muskan",
      "phone_number": "8168665701",
      "email": "muskanjangid701@gmail.com",
      "preferred_city": "Narnaul",
      "source": "FaceBook",
      "form_name": "2084223882434606",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "8168665701"
        }
      ]
    },
    {
      "lead_id": "951115784072764",
      "name": "Manik",
      "phone_number": "7047350664",
      "email": "chakrabortyavijit202@gmai.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "951115784072764",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Amity",
      "utm_campaign": "Online_MBA_Amity_CR1",
      "utm_campaign_id": "120239565744020018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "marketing"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "7047350664"
        }
      ]
    },
    {
      "lead_id": "2726560424388754",
      "name": "Sneha",
      "phone_number": "9888661731",
      "email": "sc427385@gmail.com",
      "preferred_city": "Ludhiana",
      "source": "FaceBook",
      "form_name": "2726560424388754",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919888661731"
        }
      ]
    },
    {
      "lead_id": "813490201210757",
      "name": "Biraj Bhushan Singh Rainkwar",
      "phone_number": "9599815223",
      "email": "brijbhushan04@gmail.com",
      "preferred_city": "agra",
      "source": "FaceBook",
      "form_name": "813490201210757",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26686856220937887?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1605148750713655",
      "name": "Amit Srivastava",
      "phone_number": "9451283014",
      "email": "AmitSrivastava2jan@gmail.com",
      "preferred_city": "lucknow",
      "source": "FaceBook",
      "form_name": "1605148750713655",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad02",
      "utm_campaign_id": "120240855626530240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bca"
        },
        {
          "question": "phone",
          "answer": "+919451283014"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/34559992033646774?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1863702477644977",
      "name": "Lagend Taye",
      "phone_number": "8730814323",
      "email": "tayeweda231@gmail.com",
      "preferred_city": "Seppa",
      "source": "FaceBook",
      "form_name": "1863702477644977",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918730814323"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/34529770176637894?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1481859656827813",
      "name": "Muskan",
      "phone_number": "8595262136",
      "email": "muskanmukku16@gmail.com",
      "preferred_city": "Narela delhi 110040",
      "source": "FaceBook",
      "form_name": "1481859656827813",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918595262136"
        }
      ]
    },
    {
      "lead_id": "959234453723397",
      "name": "☆ɴɪsᴛʜᴀ",
      "phone_number": "6387181235",
      "email": "atithisrivastav12@gmail.com",
      "preferred_city": "Hardoi",
      "source": "FaceBook",
      "form_name": "959234453723397",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1431201294803334",
      "name": "Satya Ranjan Mandal",
      "phone_number": "9874484984",
      "email": "satyamandal1974@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1431201294803334",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919874484984"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26208925685402815?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "26313875011555117",
      "name": "Aman Kumar",
      "phone_number": "7549303601",
      "email": "amankumar78273@gmail.com",
      "preferred_city": "katihar",
      "source": "FaceBook",
      "form_name": "26313875011555117",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917549303601"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26390571440600516?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "3395656763925124",
      "name": "______ nisha",
      "phone_number": "7009226793",
      "email": "nt6534165@gmail.com",
      "preferred_city": "Jhampur",
      "source": "FaceBook",
      "form_name": "3395656763925124",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917009226793"
        }
      ]
    },
    {
      "lead_id": "2897362750462537",
      "name": "Anshul Yadav",
      "phone_number": "9528105233",
      "email": "ay2706562@gmail.com",
      "preferred_city": "Etah",
      "source": "FaceBook",
      "form_name": "2897362750462537",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2030581217893097",
      "name": "Sreeranjini Sajith",
      "phone_number": "8129933494",
      "email": "sreeranjini188@gmail.com",
      "preferred_city": "kozhikode",
      "source": "FaceBook",
      "form_name": "2030581217893097",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918129933494"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26353124331021982?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1430080838815176",
      "name": "Aman choudhary",
      "phone_number": "7668368483",
      "email": "pankajsingh7668jatt@gmail.com",
      "preferred_city": "Sambhal",
      "source": "FaceBook",
      "form_name": "1430080838815176",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "834273048927203",
      "name": "Teena",
      "phone_number": "8384070584",
      "email": "teenaadv04@gmail.com",
      "preferred_city": "Ghaziabad",
      "source": "FaceBook",
      "form_name": "834273048927203",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "840408455733380",
      "name": "Manish Mishra",
      "phone_number": "8051318104",
      "email": "manishrupchak12@gmail.come",
      "preferred_city": "Bhaglpur",
      "source": "FaceBook",
      "form_name": "840408455733380",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918051318104"
        }
      ]
    },
    {
      "lead_id": "1251275967185891",
      "name": "Glad",
      "phone_number": "9054498725",
      "email": "prasadpratima2526@gmail.com",
      "preferred_city": "Vadodara",
      "source": "FaceBook",
      "form_name": "1251275967185891",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919054498725"
        }
      ]
    },
    {
      "lead_id": "1906640086932822",
      "name": "Biswajit Hemram",
      "phone_number": "8670155510",
      "email": "biswajithembram966@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1906640086932822",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918670155510"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/35054042350876246?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1291627242841838",
      "name": "Anu Verma",
      "phone_number": "8396910638",
      "email": "vermaanu7681@gmail.com",
      "preferred_city": "Kalka",
      "source": "FaceBook",
      "form_name": "1291627242841838",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+918396910638"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        }
      ]
    },
    {
      "lead_id": "1650698245834683",
      "name": "Bhavna Derkar",
      "phone_number": "9575660173",
      "email": "derkarbhavna2@gmail.com",
      "preferred_city": "Ballarsha",
      "source": "FaceBook",
      "form_name": "1650698245834683",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919575660173"
        }
      ]
    },
    {
      "lead_id": "1258140455891682",
      "name": "Harkesh",
      "phone_number": "7253091397",
      "email": "harkeshraj7001@gmail.com",
      "preferred_city": "Faizpura",
      "source": "FaceBook",
      "form_name": "1258140455891682",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "1682626982729913",
      "name": "Ahona Das",
      "phone_number": "+17693532206",
      "email": "namitadas20031970@gmail.com",
      "preferred_city": "Kolkata",
      "source": "FaceBook",
      "form_name": "1682626982729913",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+17693532206"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26365321896468500?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "979518604602963",
      "name": "T̳o̳x̳i̳c̳ ̳D̳i̳p̳a̳n̳s̳h̳u̳ ̳S̳i̳n̳g̳h̳",
      "phone_number": "9153066144",
      "email": "navanit550@gmail.com",
      "preferred_city": "Sheohar",
      "source": "FaceBook",
      "form_name": "979518604602963",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "943186744969822",
      "name": "Nandini Bharti",
      "phone_number": "7668269523",
      "email": "nandinibharti13@gmail.com",
      "preferred_city": "Etah",
      "source": "FaceBook",
      "form_name": "943186744969822",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+917668269523"
        }
      ]
    },
    {
      "lead_id": "821356567677527",
      "name": "Tanishq goliyan",
      "phone_number": "7452050601",
      "email": "goliyankhushi302@gmail.com",
      "preferred_city": "Meerur",
      "source": "FaceBook",
      "form_name": "821356567677527",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "3354060514754844",
      "name": "Kumar Manoj Maurya",
      "phone_number": "9452331311",
      "email": "manojmaurya611@gmail.com",
      "preferred_city": "Azamgarh",
      "source": "FaceBook",
      "form_name": "3354060514754844",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad01",
      "utm_campaign_id": "120240869439590240",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "phone",
          "answer": "+919452331311"
        }
      ]
    },
    {
      "lead_id": "1295429592511918",
      "name": "Kamlesh Jaat",
      "phone_number": "7877692629",
      "email": "kamleshjaat3647@gmail.com",
      "preferred_city": "Jaipur",
      "source": "FaceBook",
      "form_name": "1295429592511918",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917877692629"
        }
      ]
    },
    {
      "lead_id": "1629680741564144",
      "name": "Rituraj singh Tomar",
      "phone_number": "7067086682",
      "email": "riturajsinghg2580@gmail.com",
      "preferred_city": "Narsinghgarh Raj garh",
      "source": "FaceBook",
      "form_name": "1629680741564144",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917067086682"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26572341722401822?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1481499946863995",
      "name": "Mohd Anas",
      "phone_number": "9756224161",
      "email": "mohdanas4161@gmail.com",
      "preferred_city": "Moradabad",
      "source": "FaceBook",
      "form_name": "1481499946863995",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "2012454989334802",
      "name": "Akash Kashyp",
      "phone_number": "9599178015",
      "email": "ak9599178015@gmail.com",
      "preferred_city": "Loni",
      "source": "FaceBook",
      "form_name": "2012454989334802",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919599178015"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/24324813463882874?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1025431010658298",
      "name": "RAJPUT",
      "phone_number": "8447324998",
      "email": "singhshani724@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "1025431010658298",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2192375308299060",
      "name": "Anand Chhajalana",
      "phone_number": "8750162551",
      "email": "anandchhajlana@gmail.com",
      "preferred_city": "Dankaur",
      "source": "FaceBook",
      "form_name": "2192375308299060",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "1726615778775470",
      "name": "Janmenjaya Bhuyan",
      "phone_number": "8018553865",
      "email": "manoratha10@gmail.com",
      "preferred_city": "Kendrapara",
      "source": "FaceBook",
      "form_name": "1726615778775470",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918018553865"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/36123398587259593?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "973255605260587",
      "name": "ziggy_696",
      "phone_number": "9304170696",
      "email": "abu9304170@gmail.com",
      "preferred_city": "Patna",
      "source": "FaceBook",
      "form_name": "973255605260587",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1497028798597448",
      "name": "Anjali Sonole",
      "phone_number": "8830075246",
      "email": "anjalisonole145@gmail.com",
      "preferred_city": "Nagpur",
      "source": "FaceBook",
      "form_name": "1497028798597448",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918830075246"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/34887005247611199?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2647949318913219",
      "name": "Debashish Paul",
      "phone_number": "9863739267",
      "email": "debashish7085@gmail.com",
      "preferred_city": "khowai",
      "source": "FaceBook",
      "form_name": "2647949318913219",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919863739267"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26911794445071239?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1270705458571831",
      "name": "Kunal sharma",
      "phone_number": "9355206209",
      "email": "shyambabaji1111@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "1270705458571831",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "962509039487091",
      "name": "Vaibhav Singh",
      "phone_number": "7011781143",
      "email": "vaibhavshingh196@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "962509039487091",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "1000160192335275",
      "name": "jahanvi",
      "phone_number": "8439722600",
      "email": "sjahanvi117@gmail.com",
      "preferred_city": "Aligarh",
      "source": "FaceBook",
      "form_name": "1000160192335275",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "922510630630511",
      "name": "Shreya Singh",
      "phone_number": "9794370019",
      "email": "shreyasingh66111@gmail.com",
      "preferred_city": "Uttar Pradesh",
      "source": "FaceBook",
      "form_name": "922510630630511",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "2010388672879130",
      "name": "Msa Hlawnmual Msa Hlawnmual",
      "phone_number": "8974601175",
      "email": "sawma0166@gmail.com",
      "preferred_city": "mizoram",
      "source": "FaceBook",
      "form_name": "2010388672879130",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918974601175"
        }
      ]
    },
    {
      "lead_id": "970639222086188",
      "name": "BHAVYA DUBEY",
      "phone_number": "9235894659",
      "email": "cutegirlbhavya78@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "970639222086188",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "917069774268335",
      "name": "Nagesh ＣＨＯＵＤＨＡＲＹ",
      "phone_number": "8527245077",
      "email": "chaudharysam910@gmail.com",
      "preferred_city": "Noida",
      "source": "FaceBook",
      "form_name": "917069774268335",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "950946824097986",
      "name": "Sunita Yadav",
      "phone_number": "7275725621",
      "email": "sy2516776@gmail.com",
      "preferred_city": "Varanasi",
      "source": "FaceBook",
      "form_name": "950946824097986",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "1427264891973309",
      "name": "Ashwin Tiwari",
      "phone_number": "7208401710",
      "email": "ashwintiwari33@gmail.com",
      "preferred_city": "Mumbai",
      "source": "FaceBook",
      "form_name": "1427264891973309",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2081026756089080",
      "name": "Kishore Mohan",
      "phone_number": "9849270729",
      "email": "kishorepatnaik.ssvv@gmail.com",
      "preferred_city": "Hyderabad",
      "source": "FaceBook",
      "form_name": "2081026756089080",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919849270729"
        }
      ]
    },
    {
      "lead_id": "1505563641171147",
      "name": "MOON",
      "phone_number": "7531807710",
      "email": "tarunkumar942007@gmail.com",
      "preferred_city": "Nagloi",
      "source": "FaceBook",
      "form_name": "1505563641171147",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1352680083335623",
      "name": "Yanamoni mahesh",
      "phone_number": "7670975317",
      "email": "lovellypandu84@gmail.com",
      "preferred_city": "Hyderabad",
      "source": "FaceBook",
      "form_name": "1352680083335623",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917670975317"
        }
      ]
    },
    {
      "lead_id": "1345905897586651",
      "name": "BHOOPENDR SINGH",
      "phone_number": "7701912841",
      "email": "rajputrajput6334@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "1345905897586651",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "963637536136850",
      "name": "barnali Kataki",
      "phone_number": "6003979123",
      "email": "barnalikataki883@gmail.com",
      "preferred_city": "Gauhati",
      "source": "FaceBook",
      "form_name": "963637536136850",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916003979123"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25914257521604360?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "808722022280115",
      "name": "Robin Sturt",
      "phone_number": "7000466942",
      "email": "anamikasturt25@gmail.com",
      "preferred_city": "Jabalpur",
      "source": "FaceBook",
      "form_name": "808722022280115",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "7000466942"
        }
      ]
    },
    {
      "lead_id": "1295479102767854",
      "name": "𝕲𝖊𝖙𝖔𝖒 x 𝖈𝖍𝖆𝖈𝖍𝖆",
      "phone_number": "6909314794",
      "email": "tomgein8@gmail.com",
      "preferred_city": "Pasighat",
      "source": "FaceBook",
      "form_name": "1295479102767854",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+916909314794"
        }
      ]
    },
    {
      "lead_id": "1506274354217551",
      "name": "Altamash Khan Pathan",
      "phone_number": "9036578681",
      "email": "pathanaltamashkhan@gmail.com",
      "preferred_city": "Bangalore",
      "source": "FaceBook",
      "form_name": "1506274354217551",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919036578681"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26154181637607634?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1583062859466284",
      "name": "vikram kumar pandey",
      "phone_number": "6203095730",
      "email": "vikramat410@gmail.com",
      "preferred_city": "Bhagalpur",
      "source": "FaceBook",
      "form_name": "1583062859466284",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "6203095730"
        }
      ]
    },
    {
      "lead_id": "933185435787363",
      "name": "Shiv kumar Aligarh",
      "phone_number": "7830531482",
      "email": "shivkumar170320@gmail.com",
      "preferred_city": "Aligarh",
      "source": "FaceBook",
      "form_name": "933185435787363",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "7830531482"
        }
      ]
    },
    {
      "lead_id": "2065863634365919",
      "name": "Baba Nayak Srivastav",
      "phone_number": "7060358802",
      "email": "ramniwassrivasta243302@gmail.com",
      "preferred_city": "Bareilly",
      "source": "FaceBook",
      "form_name": "2065863634365919",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "985240947363281",
      "name": "arvind gupta",
      "phone_number": "8887150509",
      "email": "jtomsgonda@gmail.com",
      "preferred_city": "Gonda",
      "source": "FaceBook",
      "form_name": "985240947363281",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918887150509"
        }
      ]
    },
    {
      "lead_id": "1307526101279662",
      "name": "Sutanuka Muhuri",
      "phone_number": "9830199862",
      "email": "sutanuka.m@gmail.com",
      "preferred_city": "kolkata",
      "source": "FaceBook",
      "form_name": "1307526101279662",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919830199862"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/35135428486070959?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1859096451443686",
      "name": "Suraj Kumar",
      "phone_number": "7488774023",
      "email": "surjstm620@gmail.com",
      "preferred_city": "Sitamarhi",
      "source": "FaceBook",
      "form_name": "1859096451443686",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917488774023"
        }
      ]
    },
    {
      "lead_id": "1655278352148613",
      "name": "Asish Kumar",
      "phone_number": "6200241202",
      "email": "asisbihari@gmai.com",
      "preferred_city": "Purnia Bihar",
      "source": "FaceBook",
      "form_name": "1655278352148613",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916200241202"
        }
      ]
    },
    {
      "lead_id": "1677634826726754",
      "name": "к",
      "phone_number": "6393392899",
      "email": "kajalsingh832008@gmail.com",
      "preferred_city": "Varanasi",
      "source": "FaceBook",
      "form_name": "1677634826726754",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "2119578481935447",
      "name": "Gunjan Chaudhary",
      "phone_number": "7300620496",
      "email": "chaudharygunjan769@gmail.com",
      "preferred_city": "Dehra Dun",
      "source": "FaceBook",
      "form_name": "2119578481935447",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917300620496"
        }
      ]
    },
    {
      "lead_id": "2854490504931413",
      "name": "M.Ahmed",
      "phone_number": "6000754646",
      "email": "mugakirahmed800@gmail.com",
      "preferred_city": "Jorhat",
      "source": "FaceBook",
      "form_name": "2854490504931413",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916000754646"
        }
      ]
    },
    {
      "lead_id": "1836059371114910",
      "name": "Jyan Loner K",
      "phone_number": "6379190927",
      "email": "kuligitaraj@gmail.com",
      "preferred_city": "Dhemaji",
      "source": "FaceBook",
      "form_name": "1836059371114910",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916379190927"
        }
      ]
    },
    {
      "lead_id": "1439665307654586",
      "name": "Jyoti Shukla",
      "phone_number": "9664904707",
      "email": "jyotim5668@gmail.com",
      "preferred_city": "Ahmedabad",
      "source": "FaceBook",
      "form_name": "1439665307654586",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919664904707"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.com"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26001766512855921?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1280690486767901",
      "name": "Rahul Vig",
      "phone_number": "9999267637",
      "email": "rahulvig3@gmail.com",
      "preferred_city": "South West Delhi",
      "source": "FaceBook",
      "form_name": "1280690486767901",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Amity",
      "utm_campaign": "Online_MBA_Amity_CR1",
      "utm_campaign_id": "120239565744020018",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919999267637"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "operations_&_supply_chain"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1526148552172091",
      "name": "Sulabh Dubey",
      "phone_number": "9235636565",
      "email": "sulabhdubeyy@yahoo.com",
      "preferred_city": "Kannauj",
      "source": "FaceBook",
      "form_name": "1526148552172091",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2468354680294001",
      "name": "Shivam kumar",
      "phone_number": "7742425033",
      "email": "mindpixcell@gmail.com",
      "preferred_city": "Bihar",
      "source": "FaceBook",
      "form_name": "2468354680294001",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Amity",
      "utm_campaign": "Online_MBA_Amity_CR1",
      "utm_campaign_id": "120239565744020018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "graduation_completed"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "marketing"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917742425033"
        }
      ]
    },
    {
      "lead_id": "1493632045483209",
      "name": "BraJesh Kumar Kumar",
      "phone_number": "7523977125",
      "email": "bkk3549@gmail.com",
      "preferred_city": "hardoi",
      "source": "FaceBook",
      "form_name": "1493632045483209",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad02",
      "utm_campaign_id": "120240855626530240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "pharmacy"
        },
        {
          "question": "phone",
          "answer": "+917523977125"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26345728748426550?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1322020783166031",
      "name": "subash kahar",
      "phone_number": "9936746820",
      "email": "dr.usman.gkp@gmail.com",
      "preferred_city": "MAHARAJGANJ",
      "source": "FaceBook",
      "form_name": "1322020783166031",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "phone",
          "answer": "+919936746820"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26434016986231591?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "916781457899697",
      "name": "Vinay Singh",
      "phone_number": "9919188888",
      "email": "vinayterce@rediffmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "916781457899697",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad01",
      "utm_campaign_id": "120240869439590240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "phone",
          "answer": "+919919188888"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/35840603115538861?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1682559473057117",
      "name": "Saurav alok",
      "phone_number": "954466088",
      "email": "sauravalok64@gmail.com",
      "preferred_city": "Patna New City",
      "source": "FaceBook",
      "form_name": "1682559473057117",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "954466088"
        }
      ]
    },
    {
      "lead_id": "1448828903689604",
      "name": "8872958924",
      "phone_number": "0",
      "email": "blackhole-100012688927316-1478682933@devnull.facebook.com",
      "preferred_city": "Rupnagar",
      "source": "FaceBook",
      "form_name": "1448828903689604",
      "mode": "Online",
      "sourceUrl": "Online_MBA_LPU",
      "utm_campaign": "Online_MBA_LPU_CR1",
      "utm_campaign_id": "120240073013160018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "hr"
        },
        {
          "question": "phone",
          "answer": "0"
        }
      ]
    },
    {
      "lead_id": "1264814611852641",
      "name": "Chetan Jangid",
      "phone_number": "941619631",
      "email": "cj5631096@gmail.com",
      "preferred_city": "Panchkula",
      "source": "FaceBook",
      "form_name": "1264814611852641",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "941619631"
        }
      ]
    },
    {
      "lead_id": "837313605382919",
      "name": "Misthi Baghel",
      "phone_number": "7417847583",
      "email": "harshbaghel@gmail.com321",
      "preferred_city": "Agra",
      "source": "FaceBook",
      "form_name": "837313605382919",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2663687290653359",
      "name": "satish singh",
      "phone_number": "552522202",
      "email": "singhsatish70611@gmail.com",
      "preferred_city": "Dholpurij",
      "source": "FaceBook",
      "form_name": "2663687290653359",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "1725294365507629",
      "name": "Rahul",
      "phone_number": "+91620661941",
      "email": "jaswantratan@gmail.com",
      "preferred_city": "Bangalore devannalli",
      "source": "FaceBook",
      "form_name": "1725294365507629",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1126989782942210",
      "name": "Lalshankar Meena Meena",
      "phone_number": "9664092388",
      "email": "maidalalshankarmaida@gmail.comktoktdmcco94",
      "preferred_city": "वा घ्यान घ्  😁🥺📱📱📱📱 g",
      "source": "FaceBook",
      "form_name": "1126989782942210",
      "mode": "Online",
      "sourceUrl": "Online_MBA_Chandigarh_Uni",
      "utm_campaign": "Online_MBA_Chandigarh_Uni_CR1",
      "utm_campaign_id": "120240052097170018",
      "student_comment": [
        {
          "question": "what_is_your_current_status?",
          "answer": "graduation_completed"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "hr"
        },
        {
          "question": "phone",
          "answer": "+919664092388"
        }
      ]
    },
    {
      "lead_id": "1179818090819179",
      "name": "Vijay kumar",
      "phone_number": "9264971057",
      "email": "iamrajkumar124456@gmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "1179818090819179",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "825379783363091",
      "name": "Litton Das",
      "phone_number": "8474821759",
      "email": "littondas@gmail.com",
      "preferred_city": "silchar",
      "source": "FaceBook",
      "form_name": "825379783363091",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+918474821759"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27236080939326975?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1255680733216266",
      "name": "pawan bhadya",
      "phone_number": "9973187566",
      "email": "anupkashyap242004@gmail.com",
      "preferred_city": "Bihar siwan",
      "source": "FaceBook",
      "form_name": "1255680733216266",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/34716233794691329?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1680394382976542",
      "name": "Sajjad shoket",
      "phone_number": "8493040176",
      "email": "sajjadshoket1167@gmail.com",
      "preferred_city": "Poonch",
      "source": "FaceBook",
      "form_name": "1680394382976542",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1322389683152246",
      "name": "Aman Yadav",
      "phone_number": "7275211503",
      "email": "amanyadan7275@gmail.com",
      "preferred_city": "Lakhnaw",
      "source": "FaceBook",
      "form_name": "1322389683152246",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917275211503"
        }
      ]
    },
    {
      "lead_id": "1993789278193491",
      "name": "Kirti",
      "phone_number": "8699615051",
      "email": "at0547734@gmail.com",
      "preferred_city": "Punjab",
      "source": "FaceBook",
      "form_name": "1993789278193491",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918699615051"
        }
      ]
    },
    {
      "lead_id": "1889684798323619",
      "name": "Lovekush pandey",
      "phone_number": "6280020712",
      "email": "lovekushpandey028@gmail.com",
      "preferred_city": "Ludhiana",
      "source": "FaceBook",
      "form_name": "1889684798323619",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916280020712"
        }
      ]
    },
    {
      "lead_id": "2812845065750790",
      "name": "ANUSHKA CHAUBEY",
      "phone_number": "9236291198",
      "email": "chaubeyansuhka@gmail.com",
      "preferred_city": "Gorakhpur",
      "source": "FaceBook",
      "form_name": "2812845065750790",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad01",
      "utm_campaign_id": "120240869439590240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "law"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919236291198"
        }
      ]
    },
    {
      "lead_id": "2014359409430932",
      "name": "Lavanya...",
      "phone_number": "6366573334",
      "email": "lavanyasaravana204@gmail.com",
      "preferred_city": "Bangalore",
      "source": "FaceBook",
      "form_name": "2014359409430932",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+916366573334"
        }
      ]
    },
    {
      "lead_id": "1495718302141001",
      "name": "Sam",
      "phone_number": "7060371831",
      "email": "akmasih533@gmail.com",
      "preferred_city": "Gurugram ncr",
      "source": "FaceBook",
      "form_name": "1495718302141001",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "4050653058559611",
      "name": "kimii",
      "phone_number": "7630096541",
      "email": "roneikiminfimate16@gmail.com",
      "preferred_city": "New delhi",
      "source": "FaceBook",
      "form_name": "4050653058559611",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917630096541"
        }
      ]
    },
    {
      "lead_id": "1274972081440474",
      "name": "N WILUNGSULIU",
      "phone_number": "7708952147",
      "email": "benbennewmai594@gmail.com",
      "preferred_city": "imphal",
      "source": "FaceBook",
      "form_name": "1274972081440474",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917708952147"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27889120830688850?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1635851351076141",
      "name": "Priyanka Rathore",
      "phone_number": "9399314351",
      "email": "priyasinghrathore554@gmail.com",
      "preferred_city": "Gwalior",
      "source": "FaceBook",
      "form_name": "1635851351076141",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919399314351"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        }
      ]
    },
    {
      "lead_id": "5223168217908664",
      "name": "ͥ ͣ ͫᴅɪᴍᴘʟE Ɏ𝐚𝔡ʊꪩ𝐚ꪀš𝖍ḯ✰✧",
      "phone_number": "8533010567",
      "email": "dimpu2204@gmail.com",
      "preferred_city": "Agra",
      "source": "FaceBook",
      "form_name": "5223168217908664",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1963781761191023",
      "name": "Ꮲɪʏᴜsʜ  राजपूत",
      "phone_number": "8076224314",
      "email": "santosh1176304@gmail.com",
      "preferred_city": "Faridabad sector 87",
      "source": "FaceBook",
      "form_name": "1963781761191023",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "977863541254959",
      "name": "Nobita Sampang Rai",
      "phone_number": "7001260546",
      "email": "nobitasampang19@gmail.com",
      "preferred_city": "Darjeeling",
      "source": "FaceBook",
      "form_name": "977863541254959",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+917001260546"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/25886147987730321?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1648622482951476",
      "name": "Saraswati sing",
      "phone_number": "6371291328",
      "email": "swalit07@gmail.com",
      "preferred_city": "Baisinga",
      "source": "FaceBook",
      "form_name": "1648622482951476",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916371291328"
        }
      ]
    },
    {
      "lead_id": "1244683451069462",
      "name": "Ankush Hiranwal",
      "phone_number": "+91936866771",
      "email": "ankushhiranwal4@gmail.com",
      "preferred_city": "Bijnor",
      "source": "FaceBook",
      "form_name": "1244683451069462",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "937321935566681",
      "name": "Ashish Ahii",
      "phone_number": "+91993573459",
      "email": "aashish_hi@rediffmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "937321935566681",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad01",
      "utm_campaign_id": "120240869439590240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+91993573459"
        }
      ]
    },
    {
      "lead_id": "1641031196943810",
      "name": "Nitin kumar",
      "phone_number": "9151417907",
      "email": "nitinshakya000012@gmail.c9m",
      "preferred_city": "Kannauj",
      "source": "FaceBook",
      "form_name": "1641031196943810",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad01",
      "utm_campaign_id": "120240869439590240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919151417907"
        }
      ]
    },
    {
      "lead_id": "1001324965909628",
      "name": "Pawan Pal Pawan Pal",
      "phone_number": "055588",
      "email": "anayapal375@gmail.com",
      "preferred_city": "B",
      "source": "FaceBook",
      "form_name": "1001324965909628",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "2145059999667523",
      "name": "killer karan patel,thik out in 2G 4t5 buu t gtg gyy yy uyo5555666666l6",
      "phone_number": "8953876074",
      "email": "k.p.patel8953876074@gmail.com5",
      "preferred_city": "Uh",
      "source": "FaceBook",
      "form_name": "2145059999667523",
      "mode": "Online",
      "sourceUrl": "Online_MBA",
      "utm_campaign": "Amity_New_Targeting_T1",
      "utm_campaign_id": "120241119117630018",
      "student_comment": [
        {
          "question": "choose_your_online_mba_program",
          "answer": "international_business"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "phone",
          "answer": "+918953876074"
        }
      ]
    },
    {
      "lead_id": "1324636706227418",
      "name": "you___",
      "phone_number": "177",
      "email": "emarajkumar668@gmail.com",
      "preferred_city": "Wzz,,,,,,,,,,,,,,,,",
      "source": "FaceBook",
      "form_name": "1324636706227418",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "1336576631672936",
      "name": "Nilesh Sahujddjghdyitd gg vfffffffffffffffff ki f sffffffdfvffdff sf fb fffff dsdf sff 2sfff sdf sf",
      "phone_number": "4",
      "email": "nilessahu072@gmail.com6ad7",
      "preferred_city": "Rewa",
      "source": "FaceBook",
      "form_name": "1336576631672936",
      "mode": "Online",
      "sourceUrl": "Online_MBA",
      "utm_campaign": "Amity_Old_Targeting_T2",
      "utm_campaign_id": "120241119285330018",
      "student_comment": [
        {
          "question": "choose_your_online_mba_program",
          "answer": "data_science"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "phone",
          "answer": "4"
        }
      ]
    },
    {
      "lead_id": "2462801387571296",
      "name": "Kuldeep Lohiya",
      "phone_number": "9625562337",
      "email": "kuldeeplohiya@18gmail.c",
      "preferred_city": "Nainital",
      "source": "FaceBook",
      "form_name": "2462801387571296",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919625562337"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27037480302573412?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1383793016841251",
      "name": "Gopalkumar Ray",
      "phone_number": "7903496448",
      "email": "97095658123g@gmail.com",
      "preferred_city": "Samastipur",
      "source": "FaceBook",
      "form_name": "1383793016841251",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917903496448"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26782977978010002?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1145575354377145",
      "name": "Mm oil 0 Kumarjbbn.mbzç",
      "phone_number": "7505792976",
      "email": "kumarkrishna65373@gmail.comkkhhjjupp0ppp",
      "preferred_city": "Agar",
      "source": "FaceBook",
      "form_name": "1145575354377145",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "773807075682521",
      "name": "År̊j̊ůn̊ p̊ån̊d̊i̊t̊",
      "phone_number": "9389124082",
      "email": "krishnatiwari9382@gmail.com",
      "preferred_city": "E̊t̊åẘåh̊",
      "source": "FaceBook",
      "form_name": "773807075682521",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919389124082"
        }
      ]
    },
    {
      "lead_id": "922797450815313",
      "name": "Jayadevi PN",
      "phone_number": "9447678809",
      "email": "pnjayadevi.venugopal@g.mail.com",
      "preferred_city": "kottayam",
      "source": "FaceBook",
      "form_name": "922797450815313",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919447678809"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26809771852008492?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2072743773590498",
      "name": "kispppp",
      "phone_number": "+91625421-",
      "email": "kishankumar6203200421@gmail.comppp",
      "preferred_city": "Mumbai",
      "source": "FaceBook",
      "form_name": "2072743773590498",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1555665176346487",
      "name": "Gurlal Qila",
      "phone_number": "6284267013",
      "email": "modrnvlogmodrnvlog@gmail.com",
      "preferred_city": "Sangrur",
      "source": "FaceBook",
      "form_name": "1555665176346487",
      "mode": "Online",
      "sourceUrl": "CU_Mohali_Rem",
      "utm_campaign": "CU_Mohali_Rem_ADG1_Ad01",
      "utm_campaign_id": "120242701732740240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "arts"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916284267013"
        }
      ]
    },
    {
      "lead_id": "1328986792460609",
      "name": "Shubhm Mishra",
      "phone_number": "333.",
      "email": "shubhmmishra01@gmail.com",
      "preferred_city": "Hb",
      "source": "FaceBook",
      "form_name": "1328986792460609",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_m.com"
        }
      ]
    },
    {
      "lead_id": "1638243870736052",
      "name": "D K Tiwari",
      "phone_number": "9661376444",
      "email": "deepakkumar9061345278@gmail.com",
      "preferred_city": "Mashrak",
      "source": "FaceBook",
      "form_name": "1638243870736052",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919661376444"
        }
      ]
    },
    {
      "lead_id": "824227867009238",
      "name": "shabnamkhan",
      "phone_number": "9167954834",
      "email": "shabk916@gmail.com",
      "preferred_city": "Mumbai",
      "source": "FaceBook",
      "form_name": "824227867009238",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919167954834"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27294730946819094?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1645335520068153",
      "name": "Shubham Kashyap",
      "phone_number": "7838223044",
      "email": "shubham.sk6662@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "1645335520068153",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917838223044"
        }
      ]
    },
    {
      "lead_id": "1383975316882394",
      "name": "Satyanarayan patra",
      "phone_number": "9938277319",
      "email": "patrakcp@gmail.com",
      "preferred_city": "Barbil",
      "source": "FaceBook",
      "form_name": "1383975316882394",
      "mode": "Online",
      "sourceUrl": "AMITY_ONLINE_UG&PG_IF",
      "utm_campaign": "AMITY_ONLINE_UG&PG_IF_CR1",
      "utm_campaign_id": "120242162961710018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1244534081093256",
      "name": "Jatinder Devgan District Barnala Punjab",
      "phone_number": "9317500031",
      "email": "jatinderdevgan5@gmail.com",
      "preferred_city": "Barnala93175-00031",
      "source": "FaceBook",
      "form_name": "1244534081093256",
      "mode": "Online",
      "sourceUrl": "CU_Mohali_Int",
      "utm_campaign": "CU_Mohali_Int_ADG1_Ad01",
      "utm_campaign_id": "120242372728170240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "law"
        },
        {
          "question": "phone",
          "answer": "+919317500031"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/36122603137337988?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "2231286227275372",
      "name": "sheetal Sharma",
      "phone_number": "9103950392",
      "email": "hrsheetal.9697@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "2231286227275372",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ma"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919103950392"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27112417985019859?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1481850900147834",
      "name": "𝑃𝑟𝑎𝑛𝑠ℎ𝑢 𝑘𝑢𝑠ℎ𝑤𝑎ℎ𝑎",
      "phone_number": "6393628603",
      "email": "kushwahapranshu292@gmail.com",
      "preferred_city": "Hardoi Uttar Pradesh",
      "source": "FaceBook",
      "form_name": "1481850900147834",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bca"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916393628603"
        }
      ]
    },
    {
      "lead_id": "1003876978826078",
      "name": "Neeraj",
      "phone_number": "9875771680",
      "email": "neerajkumarprajapati722@gmail.com",
      "preferred_city": "Jaipur",
      "source": "FaceBook",
      "form_name": "1003876978826078",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919875771680"
        },
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        }
      ]
    },
    {
      "lead_id": "2694031050953902",
      "name": "Suraj Rajwanshid",
      "phone_number": "234",
      "email": "surajrajwar1234567890@gmail.com",
      "preferred_city": "Hazaribagh",
      "source": "FaceBook",
      "form_name": "2694031050953902",
      "mode": "Online",
      "sourceUrl": "ONLINE_MBA_IF_ASH",
      "utm_campaign": "ONLINE_MBA_IF_ASH_CR1",
      "utm_campaign_id": "120242492632950018",
      "student_comment": [
        {
          "question": "choose_your_online_mba_program",
          "answer": "operations_&_supply_chain"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "graduation_completed"
        },
        {
          "question": "phone",
          "answer": "234"
        }
      ]
    },
    {
      "lead_id": "2040624053191341",
      "name": "Ranjansingh@9153",
      "phone_number": "9153057414",
      "email": "ranjanyadavyadav48hjp@gmail.com",
      "preferred_city": "Hajipur",
      "source": "FaceBook",
      "form_name": "2040624053191341",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "9153057414"
        }
      ]
    },
    {
      "lead_id": "1294257095629353",
      "name": "Kishor Urao",
      "phone_number": null,
      "email": "kishororao993@gmail.com",
      "preferred_city": null,
      "source": "FaceBook",
      "form_name": "1294257095629353",
      "mode": "Online",
      "sourceUrl": "Manipal_Online_UG&PG_IF",
      "utm_campaign": "Manipal_Online_UG&PG_IF_CR2",
      "utm_campaign_id": "120242481671080018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bca"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "whatsapp_number",
          "answer": "+918597048557"
        }
      ]
    },
    {
      "lead_id": "1492090078957876",
      "name": "Manoj Singh Pal",
      "phone_number": "8979124688",
      "email": "manojsinghpal524@gmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "1492090078957876",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "916163998136823",
      "name": "Rahul Mahor",
      "phone_number": "+9170564795104",
      "email": "aaakash0831@gmail.com",
      "preferred_city": "Hodal",
      "source": "FaceBook",
      "form_name": "916163998136823",
      "mode": "Online",
      "sourceUrl": "ONLINE_MBA_IF_ASH",
      "utm_campaign": "ONLINE_MBA_IF_ASH_CR1",
      "utm_campaign_id": "120242492632950018",
      "student_comment": [
        {
          "question": "choose_your_online_mba_program",
          "answer": "marketing"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "working_professional"
        },
        {
          "question": "phone",
          "answer": "+9170564795104"
        }
      ]
    },
    {
      "lead_id": "940918545481732",
      "name": "Rajendra Singh",
      "phone_number": "+16393161114",
      "email": "rajendrasingh123@gmail.com",
      "preferred_city": "mauranipur",
      "source": "FaceBook",
      "form_name": "940918545481732",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+16393161114"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26599091259713740?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1595529168191353",
      "name": "Ravi Raj Raj",
      "phone_number": "8083301822",
      "email": "804452@gimal.come",
      "preferred_city": "Masaurhi",
      "source": "FaceBook",
      "form_name": "1595529168191353",
      "mode": "Online",
      "sourceUrl": "AMITY_ONLINE_UG&PG_IF",
      "utm_campaign": "AMITY_ONLINE_UG&PG_IF_CR1",
      "utm_campaign_id": "120242162961710018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1517326636407377",
      "name": "Sumit Pawar",
      "phone_number": "9356771582",
      "email": "adityapawar543@gmail.com",
      "preferred_city": "Pune",
      "source": "FaceBook",
      "form_name": "1517326636407377",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919356771582"
        }
      ]
    },
    {
      "lead_id": "1556524106054458",
      "name": "JAY SHREE MAHAKAL",
      "phone_number": "9509686296",
      "email": "nathjuaar@gmail.com",
      "preferred_city": "Tagatgarh",
      "source": "FaceBook",
      "form_name": "1556524106054458",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "1339715444762931",
      "name": "Nanavati krishna",
      "phone_number": "9408636390",
      "email": "virajnanavati47@gmail.com",
      "preferred_city": "Ahmedabad",
      "source": "FaceBook",
      "form_name": "1339715444762931",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919408636390"
        }
      ]
    },
    {
      "lead_id": "976417898449135",
      "name": "manik",
      "phone_number": null,
      "email": "chakraborty@gmail.com",
      "preferred_city": null,
      "source": "FaceBook",
      "form_name": "976417898449135",
      "mode": "Online",
      "sourceUrl": "Manipal_Online_UG&PG_IF",
      "utm_campaign": "Manipal_Online_UG&PG_IF_CR2",
      "utm_campaign_id": "120242481671080018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "mba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "whatsapp_number",
          "answer": "+917047350664"
        }
      ]
    },
    {
      "lead_id": "3956855644620003",
      "name": "Dharmendra Roy",
      "phone_number": "7007321159",
      "email": "mrroy956935@gmail.com",
      "preferred_city": "Konch",
      "source": "FaceBook",
      "form_name": "3956855644620003",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917007321159"
        }
      ]
    },
    {
      "lead_id": "1000254605744972",
      "name": "Kunal Kuna",
      "phone_number": "8171677454",
      "email": "aadi42051@gmail.com",
      "preferred_city": "Dehra Dun",
      "source": "FaceBook",
      "form_name": "1000254605744972",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "1365006975461105",
      "name": "Arpit",
      "phone_number": "9266779230",
      "email": "alokkumar987354@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "1365006975461105",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+919266779230"
        }
      ]
    },
    {
      "lead_id": "1291996705833063",
      "name": "George Gabil Momin",
      "phone_number": "+16009080923",
      "email": "georgegmomin09@gmail.com",
      "preferred_city": "Kharkutta",
      "source": "FaceBook",
      "form_name": "1291996705833063",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+16009080923"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27170614419242993?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1336520078373763",
      "name": "हिमांशु राजपूत",
      "phone_number": "7505919345",
      "email": "avedesh310799@gmail.com",
      "preferred_city": "Mainpuri",
      "source": "FaceBook",
      "form_name": "1336520078373763",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1195502399254584",
      "name": "Pooran Chandra Bhatt",
      "phone_number": "8630778708",
      "email": "parkashbhatt347@gmail.com",
      "preferred_city": "Haldwani",
      "source": "FaceBook",
      "form_name": "1195502399254584",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918630778708"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27164021009858301?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1635498947707242",
      "name": "Surbhi",
      "phone_number": "6398767758",
      "email": "surbhipunni28@gmail.com",
      "preferred_city": "Muradabad",
      "source": "FaceBook",
      "form_name": "1635498947707242",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_ba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+916398767758"
        }
      ]
    },
    {
      "lead_id": "953927844016872",
      "name": "Mr. Nilendu kumar",
      "phone_number": "9708239568",
      "email": "nilendukum707044@gmail.com",
      "preferred_city": "Sitamarhi",
      "source": "FaceBook",
      "form_name": "953927844016872",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "4486776144914528",
      "name": "Bhupendra kumar Suryavanshi",
      "phone_number": "8218872648",
      "email": "kumarbhupendra39524@gmail.com",
      "preferred_city": "Dfjhhbbhfchv",
      "source": "FaceBook",
      "form_name": "4486776144914528",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_ma"
        }
      ]
    },
    {
      "lead_id": "996451649914327",
      "name": "Rajeev Yadav",
      "phone_number": "8271058216",
      "email": "rajeevkumar827105@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "996451649914327",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_b.com"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918271058216"
        }
      ]
    },
    {
      "lead_id": "2159372808172156",
      "name": "Meet Patel",
      "phone_number": "8320667974",
      "email": "meetp4538@gmail.com",
      "preferred_city": null,
      "source": "FaceBook",
      "form_name": "2159372808172156",
      "mode": "Online",
      "sourceUrl": "AMITY_ONLINE_UG&PG_IF",
      "utm_campaign": "AMITY_ONLINE_UG&PG_IF_2_CR2",
      "utm_campaign_id": "120242595831380018",
      "student_comment": [
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "which_online_course_are_you_interested_in?",
          "answer": "online_mca"
        }
      ]
    },
    {
      "lead_id": "925123630554708",
      "name": "Jâì Dhãñkër",
      "phone_number": "9548645751",
      "email": "jaatjp41@gmail.com",
      "preferred_city": "Bawal",
      "source": "FaceBook",
      "form_name": "925123630554708",
      "mode": "Online",
      "sourceUrl": "ONLINE_MBA_IF",
      "utm_campaign": "ONLINE_MBA_IF_3_CR2",
      "utm_campaign_id": "120242190404470018",
      "student_comment": [
        {
          "question": "phone",
          "answer": "+919548645751"
        },
        {
          "question": "what_is_your_current_status?",
          "answer": "just_exploring"
        },
        {
          "question": "choose_your_online_mba_program_?",
          "answer": "hr"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "1697939507896986",
      "name": "Pranshu Rider",
      "phone_number": "8175052494",
      "email": "pranshudubey81703@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "1697939507896986",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bca"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+918175052494"
        }
      ]
    },
    {
      "lead_id": "1677576387006681",
      "name": "Karan Deshwar",
      "phone_number": "7248823993",
      "email": "karandeshwar8@gmail.com",
      "preferred_city": "New Delhi",
      "source": "FaceBook",
      "form_name": "1677576387006681",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917248823993"
        }
      ]
    },
    {
      "lead_id": "1309668920719166",
      "name": "Hemant verma",
      "phone_number": "7878709135",
      "email": "Hmntverma08@gmail.com",
      "preferred_city": "Udaipur",
      "source": "FaceBook",
      "form_name": "1309668920719166",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+917878709135"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27110940678501211?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1845980343027907",
      "name": "pandit _PranshuSharma",
      "phone_number": "6387066347",
      "email": "sharmaanshul1239@gmail.com",
      "preferred_city": "Kuthond",
      "source": "FaceBook",
      "form_name": "1845980343027907",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "2262433741230618",
      "name": "Rajesh Kumar",
      "phone_number": "7986696146",
      "email": "shiom4rk@gmail.com",
      "preferred_city": "Nabha",
      "source": "FaceBook",
      "form_name": "2262433741230618",
      "mode": "Online",
      "sourceUrl": "Panjab_Online_Courses_Admission_DFYD",
      "utm_campaign": "Panjab_Online_Courses_Admission_DFYD_PB_CH_Ad01",
      "utm_campaign_id": "120243499473860240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+917986696146"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26625627820376408?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "4302858366696381",
      "name": "Rakesh",
      "phone_number": "9991373139",
      "email": "rakshakxons1.2@gmail.com",
      "preferred_city": "Palwal",
      "source": "FaceBook",
      "form_name": "4302858366696381",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bca"
        }
      ]
    },
    {
      "lead_id": "1285856480301977",
      "name": "Anshul Shakya ,",
      "phone_number": "9536450094",
      "email": "anshulshakya990865@gmail.com",
      "preferred_city": "Etah",
      "source": "FaceBook",
      "form_name": "1285856480301977",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Int",
      "utm_campaign": "CU_Lucknow_Int_ADG1_Ad02",
      "utm_campaign_id": "120240869439580240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "engineering_(b.tech_/_m.tech)"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919536450094"
        }
      ]
    },
    {
      "lead_id": "859497400527107",
      "name": "Vivek Kumar Singh",
      "phone_number": "9568181202",
      "email": "vivekkumar956818@gmail.com",
      "preferred_city": "Badaun",
      "source": "FaceBook",
      "form_name": "859497400527107",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "853608204456903",
      "name": "Prabhat Kumar",
      "phone_number": "8092245628",
      "email": "pk1087531@gmail.com",
      "preferred_city": "Khagaria",
      "source": "FaceBook",
      "form_name": "853608204456903",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_mba"
        }
      ]
    },
    {
      "lead_id": "969386285696164",
      "name": "Kashyap Ji",
      "phone_number": "8923075193",
      "email": "ashutoshnarayan164@gmail.com",
      "preferred_city": "Khatauli",
      "source": "FaceBook",
      "form_name": "969386285696164",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "1188462803318177",
      "name": "Osama Ansari",
      "phone_number": "9214794051",
      "email": "osamaansari910276@gmail.com",
      "preferred_city": "Shrawasti",
      "source": "FaceBook",
      "form_name": "1188462803318177",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "mba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919214794051"
        }
      ]
    },
    {
      "lead_id": "1640227433914997",
      "name": "D Chandra",
      "phone_number": "8922801109",
      "email": "deepchandra1509@gmail.com",
      "preferred_city": "Allahabad",
      "source": "FaceBook",
      "form_name": "1640227433914997",
      "mode": "Online",
      "sourceUrl": "AMITY_ONLINE_UG&PG_IF",
      "utm_campaign": "AMITY_ONLINE_UG&PG_IF_CR1",
      "utm_campaign_id": "120242162961710018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "ba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        }
      ]
    },
    {
      "lead_id": "1528780901923510",
      "name": "Philo",
      "phone_number": "9632716835",
      "email": "tanss@rediffmail.com",
      "preferred_city": "Bangalore",
      "source": "FaceBook",
      "form_name": "1528780901923510",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.sc"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919632716835"
        }
      ]
    },
    {
      "lead_id": "2428414987636250",
      "name": "_modal_beby _1_29",
      "phone_number": "8055682514",
      "email": "pv4207575@gmail.com",
      "preferred_city": "Nagpur",
      "source": "FaceBook",
      "form_name": "2428414987636250",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+918055682514"
        }
      ]
    },
    {
      "lead_id": "2436949470099795",
      "name": "Mohd Najeeb",
      "phone_number": "8707383067",
      "email": "mohdnajeeb806@gmail.com",
      "preferred_city": "Lucknow",
      "source": "FaceBook",
      "form_name": "2436949470099795",
      "mode": "Online",
      "sourceUrl": "Galgotias_Lead_2026",
      "utm_campaign": "Galgotias_Leads_2026_P_Ad_01",
      "utm_campaign_id": "120235738726290240",
      "student_comment": [
        {
          "question": "which_online_degree_course_are_you_interested_in?_",
          "answer": "online_bba"
        }
      ]
    },
    {
      "lead_id": "2089742548254682",
      "name": "प्रांजल सिंह राठौड़",
      "phone_number": "9140959288",
      "email": "rathodpranjal2@gmail.com",
      "preferred_city": "Kanpur",
      "source": "FaceBook",
      "form_name": "2089742548254682",
      "mode": "Online",
      "sourceUrl": "CU_Lucknow_Remarketing",
      "utm_campaign": "CU_Lucknow_Rem_Ad01",
      "utm_campaign_id": "120240852820770240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bca"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919140959288"
        }
      ]
    },
    {
      "lead_id": "1455551219134106",
      "name": "Alin Zazbir Rahman",
      "phone_number": "6002117050",
      "email": "alinzazbirrahman@gmail.com",
      "preferred_city": "Dhubri",
      "source": "FaceBook",
      "form_name": "1455551219134106",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mca"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "not_sure,_need_counselling"
        },
        {
          "question": "phone",
          "answer": "+916002117050"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/26914092044886448?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "1005061095542056",
      "name": "alshat jha",
      "phone_number": "8789423391",
      "email": "mithi081988@gmail.com",
      "preferred_city": "Ranchi",
      "source": "FaceBook",
      "form_name": "1005061095542056",
      "mode": "Online",
      "sourceUrl": "AMITY_ONLINE_UG&PG_IF",
      "utm_campaign": "AMITY_ONLINE_UG&PG_IF_CR1",
      "utm_campaign_id": "120242162961710018",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "bba"
        },
        {
          "question": "when_do_you_plan_to_enroll?",
          "answer": "immediately"
        }
      ]
    },
    {
      "lead_id": "867087295651520",
      "name": "Gautam Anup Gupta",
      "phone_number": "9898066401",
      "email": "aratig305@gmail.com",
      "preferred_city": "Mehsana",
      "source": "FaceBook",
      "form_name": "867087295651520",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Rest_Ad01",
      "utm_campaign_id": "120238391040020240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_mba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+919898066401"
        }
      ]
    },
    {
      "lead_id": "1852460455443802",
      "name": "Nongthombam Helena",
      "phone_number": "6009148509",
      "email": "nongthombamhelena37@gmail.com",
      "preferred_city": "Imphal",
      "source": "FaceBook",
      "form_name": "1852460455443802",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_m.sc"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "within_the_next_month"
        },
        {
          "question": "phone",
          "answer": "+916009148509"
        },
        {
          "question": "inbox_url",
          "answer": "https://business.facebook.com/latest/27071856135743405?nav_ref=thread_view_by_psid"
        }
      ]
    },
    {
      "lead_id": "36061063503507319",
      "name": "Gaurav",
      "phone_number": "9899147663",
      "email": "gauravgamer713914@gmail.com",
      "preferred_city": "Delhi",
      "source": "FaceBook",
      "form_name": "36061063503507319",
      "mode": "Online",
      "sourceUrl": "IGNOU_Online_Courses_Admission_DFYD",
      "utm_campaign": "IGNOU_Online_Courses_Admission_DFYD_Delhi_NCR_Ad01",
      "utm_campaign_id": "120238390992910240",
      "student_comment": [
        {
          "question": "which_course_are_you_most_interested_in?",
          "answer": "online_bba"
        },
        {
          "question": "when_do_you_plan_to_enroll_in_your_online_program?",
          "answer": "immediately"
        },
        {
          "question": "phone",
          "answer": "+919899147663"
        }
      ]
    }
  ]

const API_URL = 'https://enterprise-lms-api.degreefyd.com/api/leads/batch';

const BATCH_SIZE = 80;

function chunkArray(arr, size) {
  const batches = [];

  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }

  return batches;
}

async function sendBatchWise() {
  const batches = chunkArray(data, BATCH_SIZE);

  console.log(`Total batches: ${batches.length}`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];

    try {
      console.log(`Sending batch ${i + 1}`);

      const response = await axios.post(
        API_URL,
        {
          data: batch
        },
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );

      console.log(`Batch ${i + 1} Success`);
      console.log(response.data);
    } catch (error) {
      console.log(`Batch ${i + 1} Failed`);

      if (error.response) {
        console.log(error.response.data);
      } else {
        console.log(error.message);
      }
    }

    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log('All batches completed');
}

sendBatchWise();